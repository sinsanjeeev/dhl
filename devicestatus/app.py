import sys
import os
import json
import threading
import time
import queue

from dhlstatus.mqtt.dhlmqtt import MQTTHelper
from dhlstatus.logger.dhllogger import DHLlogger
from dhlstatus.util.dbutil import DHLDatabase
from concurrent.futures import ThreadPoolExecutor
from dhlstatus.util.dbutil import CursorFromConnectionPool
from dhlstatus.statusmgmt import status

class DHLDeviceStateMain(object):
    def __init__(self, args):
        self.topic_name = None
        self.opts = {}
        self.mqtt_appid = os.environ.get('MQTT_APPID')
        self.org_id = os.environ.get('ORG_ID')
        self.device_list = os.environ.get('DEVICE_LIST')
        self.site_code=os.environ.get('SITE_CODE')
        self.queue = queue.Queue(maxsize=100)
        self.logger = DHLlogger('./log/devicestatus.log')
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


        mqttconfig = {
            'auth': {'key': self.secret_mqtt_key,
                     'token': self.secret_mqtt_token},
            'identity': {'appId': self.mqtt_appid}
        }
        self.db_helper = DHLDatabase.initialise(database=self.secret_db,
                                                user=self.secret_db_user,
                                                password=self.secret_db_pass,
                                                host=self.secret_db_host,
                                                port=self.secret_db_port)

        self.StateManagementProcess = status.StateManagement(CursorFromConnectionPool, self.site_code, self.logger)
        self.mqtt_helper = MQTTHelper(self.org_id, self.device_list, mqttconfig)


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
            self.logger.logInfo('app:57', "**************************Message received {}".format(msg))
            msgdict = json.loads(msg)
            try:
                self.StateManagementProcess.process_state(msgdict)
                end = time.perf_counter()
                timetaken = end - start
                self.logger.logInfo('app:63',
                                    "**************************Message successfully processed in {} sec".format(
                                        timetaken))
            except Exception as e:
                print(e)
                self.logger.logInfo('app:68',
                                    "**************************Exception while processing message {} sec".format(e))


if __name__ == "__main__":
    dhlmain = DHLDeviceStateMain(sys.argv)
    mqttclient = dhlmain.mqtt_helper.getClient()
    mqttclient.deviceEventCallback = dhlmain.myEventCallback
    mqttclient.subscriptionCallback = dhlmain.mySubscribeCallback
    print("connected")

    with ThreadPoolExecutor(max_workers=2) as pool:
        pool.submit(dhlmain.processQueueMessage, dhlmain.queue)
