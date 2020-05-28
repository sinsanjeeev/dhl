import datetime
import json
import logging
import os

import pandas as pd
import psycopg2
import time


from dhlstatus.util.dbutil import CursorFromConnectionPool
from dhlstatus.util.dbutil import DHLDatabase
import codecs

class StateManagement():
    def __init__(self, cursorfromconpool, site_code,logger=None):
        if logger:
            self.logger = logger
        else:
            self.logger = logging.getLogger(__name__)

        self.cursorfromconpool = cursorfromconpool

        self.lastdatetime = datetime.datetime.now()

        self.site_id=self.load_site_id(site_code)

        self.secret_db_user = os.getenv("SECRET_DBUSERNAME", None)
        self.secret_db_pass = os.getenv("SECRET_DBPASS", None)
        self.secret_db = os.getenv("SECRET_DB", None)
        self.secret_db_host = os.getenv("SECRET_DBHOST", None)
        self.secret_db_port = os.getenv("SECRET_DBPORT", None)

    def process_state(self, msgdict):
        deviceid=msgdict['ConeID']
        devicetype = 'forklift'
        mode = msgdict['Mode']
        uwbdict = msgdict['LocationTag']
        uwbstatus=uwbdict['status']
        rfiddict=msgdict['RFIDReader']
        rfidstatus = rfiddict['status']
        computedict = msgdict['ComputeModule']
        computestatus = computedict['status']
        computeteledict = computedict['telemetry']
        computetelestr=json.dumps(computeteledict)
        timestamp = msgdict['timestamp']
        gwtimestamp = msgdict['GWtimestamp']
        datestr = datetime.datetime.utcnow().strftime('%Y-%m-%d %H:%M:%S')
        devicetuple=(deviceid,devicetype,mode,uwbstatus,rfidstatus,computestatus,computetelestr,timestamp,gwtimestamp,self.site_id,datestr)

        self._insert_and_update_device_state_log(devicetuple)

        currentdatetime = datetime.datetime.now()
        dateTimeDifference = currentdatetime - self.lastdatetime
        dateTimeDifferenceinsec = dateTimeDifference.total_seconds()
        if(dateTimeDifferenceinsec > 300):
            self.lastdatetime=currentdatetime
            self._update_mode_offile()





    def load_site_id(self,site_code):
        dat = None
        site_id=None
        try:

            with self.cursorfromconpool() as tup:
                conn = tup[1]
                sql = "SELECT site_id, site_code, site_name, site_address, enterprise_id, " \
                      "site_coordinate, city from dhl_site where site_code='{}'".format(site_code)
                dat = pd.read_sql_query(sql, conn)
                # print(dat)
                for i, row in dat.iterrows():
                    # print(i,row)
                    site_id = dat['site_id'][i]

        except Exception as e:
            self.logger.logDebug('state:33', 'Exception while site loading state{}'.format(e))
        if dat is not None:
            self.logger.logDebug('state:91', 'locations are loaded {}'.format(dat.size))
        else:
            self.logger.logDebug('state:93', 'locations are not loaded and empty')

        return site_id


    def _insert_and_update_device_state_log(self, inserttuple):
        #tuples_str_insert = ', '.join(map(str, inserttuple))

        retrycount = 0

        sqlupsert_insert = "INSERT INTO public.dhl_device_status_log (device_id, device_type, mode, " \
                           "uwb_status, rfid_status,compute_model_status,compute_model_telemetry,device_timestamp," \
                           "gw_timestamp,site_id,updated_utc) " \
                           " VALUES " \
                           " {} ".format(inserttuple)
        sqlupsert_update = "INSERT INTO public.dhl_device_status_state (device_id, device_type, mode, " \
                           "uwb_status, rfid_status,compute_model_status,compute_model_telemetry,device_timestamp," \
                           "gw_timestamp,site_id,updated_utc) " \
                           "VALUES" \
                           " {} " \
                           "ON CONFLICT (device_id) DO UPDATE " \
                           "SET mode=EXCLUDED.mode ,uwb_status=EXCLUDED.uwb_status" \
                           ",rfid_status=EXCLUDED.rfid_status,compute_model_status=EXCLUDED.compute_model_status," \
                           "compute_model_telemetry=EXCLUDED.compute_model_telemetry," \
                           "device_timestamp=EXCLUDED.device_timestamp," \
                           "gw_timestamp=EXCLUDED.gw_timestamp,updated_utc=EXCLUDED.updated_utc".format(inserttuple)

        while True:

            with self.cursorfromconpool() as tup:
                cursor = tup[0]
                conn = tup[1]
                try:

                    cursor.execute(sqlupsert_update)
                    cursor.execute(sqlupsert_insert)
                    break
                except psycopg2.OperationalError as error:
                    # print(conn.closed)
                    self.logger.logDebug('state:118', 'Exception while update state{}'.format(error))
                    if (conn.closed > 0):
                        self.logger.logInfo('state:131',
                                            'Connection is not available trying to reconnect {}'.format(error))
                        self.reconnect()
                    retrycount += 1
                except (Exception, psycopg2.Error) as error:
                    retrycount += 1
                    # print(conn.closed)
                    self.logger.logDebug('state:127', 'Exception while update state{}'.format(error))
                    if (conn.closed > 0):
                        self.logger.logInfo('state:139',
                                            'Connection is not available trying to reconnect {}'.format(error))
                        self.reconnect()
            if (retrycount == 0 or retrycount == 4):
                break
            if (retrycount > 0 and retrycount < 4):
                continue

    def _update_mode_offile(self):
        #tuples_str_insert = ', '.join(map(str, inserttuple))

        retrycount = 0

        sqlupdateoffile="update dhl_device_status_state set mode='OFFLINE' where " \
                        "EXTRACT(MIN FROM now_utc()-updated_utc) > 5"
        while True:

            with self.cursorfromconpool() as tup:
                cursor = tup[0]
                conn = tup[1]
                try:
                    cursor.execute(sqlupdateoffile)
                    break
                except psycopg2.OperationalError as error:
                    self.logger.logDebug('state:153', 'Exception while update state{}'.format(error))
                    # print(conn.closed)
                    if (conn.closed > 0):
                        self.logger.logInfo('state:131',
                                            'Connection is not available trying to reconnect {}'.format(error))
                        self.reconnect()
                    retrycount += 1
                except (Exception, psycopg2.Error) as error:
                    self.logger.logDebug('state:161', 'Exception while update state{}'.format(error))
                    retrycount += 1
                    # print(conn.closed)
                    if (conn.closed > 0):
                        self.logger.logInfo('state:139',
                                            'Connection is not available trying to reconnect {}'.format(error))
                        self.reconnect()
            if (retrycount == 0 or retrycount == 4):
                break
            if (retrycount > 0 and retrycount < 4):
                continue

    def reconnect(self):

        retry = 0
        for i in range(1, 4):
            try:
                self.logger.logDebug('state:367',
                                     'reconnecting database connection.retry count is:{}'.format(i))
                self.db_helper = DHLDatabase.initialise(database=self.secret_db,
                                                        user=self.secret_db_user,
                                                        password=self.secret_db_pass,
                                                        host=self.secret_db_host,
                                                        port=self.secret_db_port)
                break
            except Exception as e:
                self.logger.logInfo("state:324 ", 'connection exception: {}'.format(e))
                time.sleep(3)

                continue
    def hextoascii(self,epccode):
        try:
            epcref=codecs.decode(codecs.decode(epccode, 'hex'), 'ascii')
        except Exception as e:
            print(e)
        return epcref

if __name__ == "__main__":
    from dhlstatus.logger.dhllogger import DHLlogger

    logger = DHLlogger('/root/IOT/project/dhl/devicestatus/log/devicestatus.log')
    logger.logInfo("state", 'in main')

    secret_db_user = os.getenv("SECRET_DBUSERNAME", None)
    secret_db_pass = os.getenv("SECRET_DBPASS", None)
    secret_db = os.getenv("SECRET_DB", None)
    secret_db_host = os.getenv("SECRET_DBHOST", None)
    secret_db_port = os.getenv("SECRET_DBPORT", None)
    DHLDatabase.initialise(database=secret_db,
                           user=secret_db_user,
                           password=secret_db_pass,
                           host=secret_db_host,
                           port=secret_db_port)
    StateManagementProcess = StateManagement(CursorFromConnectionPool,'ORD', logger)

    dicttemp = {
"ConeID": "ORDF01",
"DeviceType": "forklift",
"Mode": "Charging",
"LocationTag": {
"ID": 1,
"status": "ON"
},
"RFIDReader": {
"ID": 1,
"status": "IDLE"
},
"ComputeModule": {
"ID": 1,
"status": "ON",
"telemetry": {
    "ram": "50%",
    "cpu": "20%",
    "storage": "95%"
}
},
"timestamp": "2019-04-03T13:35:54Z",
"GWtimestamp": "2019-04-03T13:36:04Z"
}
    StateManagementProcess.process_state(dicttemp)
