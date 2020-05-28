import sys
import os
import json
import threading
import time
import queue

from dhl.mqtt.dhlmqtt import MQTTHelper
from dhl.logger.dhllogger import DHLlogger
from dhl.util.dbutil import DHLDatabase
from concurrent.futures import ThreadPoolExecutor
from dhl.util.dbutil import CursorFromConnectionPool
from dhl.statemgmt import state

from flask import Flask,jsonify
from flask import send_file,render_template
import glob
import zipfile
from flask_cors import CORS
import os
import subprocess

WEB_PORT = os.getenv("WEB_PORT", None)
WEB_HOST = os.getenv("WEB_HOST", None)
dhl_url = os.getenv("DHL_URL", None)
use_redis=os.getenv("USER_REDIS", None)


app1 = Flask(__name__, template_folder='log')
CORS(app1)
class DHLStateMain(object):
    def __init__(self, args):
        self.topic_name = None
        self.opts = {}
        self.mqtt_appid = os.environ.get('MQTT_APPID')
        self.org_id = os.environ.get('ORG_ID')
        self.use_redis = os.environ.get("USE_REDIS")
        self.redis_host = os.environ.get("REDIS_HOST")
        self.redis_port = os.environ.get("REDIS_PORT")
        self.redis_pwd = os.environ.get("REDIS_PWD")
        self.device_list = os.environ.get('DEVICE_LIST')
        self.site_code=os.environ.get('SITE_CODE')
        self.queue = queue.Queue(maxsize=100)
        self.logger = DHLlogger('./log/trackntrace.log')
        self.logger.logInfo('app', 'Logger Initialized')
        self.StateManagementProce = None

        self.secret_db_user = os.getenv("SECRET_DBUSERNAME", None)
        self.secret_db_pass = os.getenv("SECRET_DBPASS", None)
        self.secret_db = os.getenv("SECRET_DB", None)
        self.secret_db_host = os.getenv("SECRET_DBHOST", None)
        self.secret_db_port = os.getenv("SECRET_DBPORT", None)
        self.secret_mqtt_key = os.getenv("SECRET_IOT_KEY", None)
        self.secret_mqtt_token = os.getenv("SECRET_IOT_TOKEN", None)
        self.secret_redis_host = os.getenv("SECRET_REDIS_HOST", None)
        self.secret_redis_port = os.getenv("SECRET_REDIS_PORT", None)
        self.secret_redis_pass = os.getenv("SECRET_REDIS_PASS", None)
        # self.mqtt_helper=MQTTHelper()


        mqttconfig={
            'auth': {'key': self.secret_mqtt_key,
                     'token': self.secret_mqtt_token},
            'identity': {'appId': self.mqtt_appid}
        }
        self.db_helper = DHLDatabase.initialise(database=self.secret_db,
                                                user=self.secret_db_user,
                                                password=self.secret_db_pass,
                                                host=self.secret_db_host,
                                                port=self.secret_db_port)

        self.StateManagementProcess = state.StateManagement(CursorFromConnectionPool,
                                                            self.site_code,
                                                            self.use_redis,
                                                            self.secret_redis_host,
                                                            self.secret_redis_port,
                                                            self.secret_redis_pass,
                                                            self.logger
                                                            )
        self.mqtt_helper = MQTTHelper(self.org_id, self.device_list,mqttconfig)


    def myEventCallback(self, event):
        self.logger.logInfo("app:42", "%-33s%-30s%s" % (
        event.timestamp.isoformat(), event.device, event.eventId + ": " + json.dumps(event.data)))
        self.queue.put(json.dumps(event.data))

    def mySubscribeCallback(self, mid, qos):

        print("<< Subscription established for status messages at qos %s >> " % qos[0])

    def processQueueMessage(self, queue):
        while True:
            self.logger.logInfo('app:50', "Waiting for message")
            msg = queue.get()
            start = time.perf_counter()
            self.logger.logInfo('app:52', "**************************Message received {}".format(msg))
            msgdict = json.loads(msg)
            try:
                self.StateManagementProcess.process_state(msgdict)
                end = time.perf_counter()
                timetaken = end - start
                self.logger.logInfo('app:56',
                                    "**************************Message successfully processed in {} sec".format(
                                        timetaken))
            except Exception as e:
                print(e)


if __name__ == "__main__":
    dhlmain = DHLStateMain(sys.argv)
    mqttclient = dhlmain.mqtt_helper.getClient()
    mqttclient.deviceEventCallback = dhlmain.myEventCallback
    mqttclient.subscriptionCallback = dhlmain.mySubscribeCallback
    print("connected")


    def runFlaskApp1():
        app1.run(host=WEB_HOST, port=WEB_PORT, debug=False, threaded=True)


    def tail(f, n, offset=0):
        offset_total = str(n + offset)
        proc = subprocess.Popen(['tail', '-n', str(n + offset), f], stdout=subprocess.PIPE)
        lines = proc.stdout.readlines()
        lineskey = []
        linesStr = []
        cnt = 0
        for line in lines:
            cnt = cnt + 1
            linesStr.append(line.decode("utf-8"))
            lineskey.append(str(cnt))

        di = dict(zip(lineskey, linesStr))
        return di


    @app1.route('/' + dhl_url + '/dhl/log')
    def connlogprod():
        logJson = tail('./log//trackntrace.log', 100)
        return jsonify(logJson)


    @app1.route('/' + dhl_url + '/dhl/download')
    def downloadFileprod():
        # For windows you need to use drive name [ex: F:/Example.pdf]
        try:
            import zlib
            mode = zipfile.ZIP_DEFLATED
        except:
            mode = zipfile.ZIP_STORED

        file_paths = glob.glob('./log/trackntrace.*')
        path = "./zip/dhl_log.zip"
        with zipfile.ZipFile('./zip/dhl_log.zip', 'w', mode, allowZip64=True) as zip:
            # writing each file one by one
            for file in file_paths:
                zip.write(file)
                # zip.close()
        return send_file(path, as_attachment=True, cache_timeout=-1)

    with ThreadPoolExecutor(max_workers=2) as pool:
        pool.submit(runFlaskApp1)
        pool.submit(dhlmain.processQueueMessage, dhlmain.queue)
