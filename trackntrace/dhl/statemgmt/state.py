import datetime
import json
import logging
import os

import redis

import pandas as pd
import psycopg2
import time
from shapely import geometry

from dhl.util.dbutil import CursorFromConnectionPool
from dhl.util.dbutil import DHLDatabase
import codecs

class StateManagement():
    def __init__(self, cursorfromconpool, site_code,use_redis,redis_host,redis_port,redis_pwd,logger=None):
        if logger:
            self.logger = logger
        else:
            self.logger = logging.getLogger(__name__)
        self.secret_db_user = os.getenv("SECRET_DBUSERNAME", None)
        self.secret_db_pass = os.getenv("SECRET_DBPASS", None)
        self.secret_db = os.getenv("SECRET_DB", None)
        self.secret_db_host = os.getenv("SECRET_DBHOST", None)
        self.secret_db_port = os.getenv("SECRET_DBPORT", None)

        self.lastdatetime = datetime.datetime.now()
        self.cursorfromconpool = cursorfromconpool
        self.use_redis=use_redis
        self.site_code= site_code
        self.redis_conn=None
        self.location_site_detail=None
        self.site_id=None
        self.sys_props=None
        try:
            if(use_redis=='T'):
                #self.redis_conn=redis.Redis(host=redis_host, port=redis_port,password=redis_pwd)
                self.redis_conn = redis.StrictRedis(host=redis_host, port=redis_port,password=redis_pwd, charset="utf-8", decode_responses=True)
                self.logger.logInfo('state:35', "redis connection established")
                if(self.redis_conn is not None):

                    self.location_site_detail=self.redis_conn.get('loc_detail_{}'.format(site_code))

                    if self.location_site_detail is not None:
                        self.logger.logInfo('state:40',
                                            "redis location_site_detail is not none")
                        self.location_site_detail=json.loads(self.location_site_detail)
                        self.location_site_detail=pd.DataFrame(self.location_site_detail)
                    self.site_id = self.redis_conn.get('site_id_{}'.format(site_code))
                    self.logger.logInfo('state:43',
                                        "redis site_id is {}".format(self.site_id))
                    if(self.site_id is not None):
                        self.site_id=int(self.site_id)
                    self.sys_props = self.redis_conn.get('sys_props_{}'.format(site_code))

                    if self.sys_props is not None:
                        self.logger.logInfo('state:52',
                                            "redis sys_props is not none")
                        self.sys_props = json.loads(self.sys_props)
                        self.sys_props = pd.DataFrame(self.sys_props)

                    if(self.location_site_detail is None):
                        self.logger.logInfo('state:60',
                                            "redis location_site_detail is  none")
                        self.location_site_detail = self.load_location(site_code)
                        dlocDict = self.location_site_detail.to_dict('r')
                        dlocDict=json.dumps(dlocDict)
                        self.redis_conn.set('loc_detail_{}'.format(site_code),dlocDict)
                    if (self.site_id is None):
                        self.site_id = self.load_site_id(site_code)

                        self.redis_conn.set('site_id_{}'.format(site_code),  int(self.site_id))
                    if (self.sys_props is None):
                        self.logger.logInfo('state:71',
                                            "redis sys_props is  none")
                        self.sys_props = self.load_sys_props(site_code)
                        dpropDict=self.sys_props.to_dict('r')
                        dpropDict=json.dumps(dpropDict)
                        self.redis_conn.set('sys_props_{}'.format(site_code),  dpropDict)
            else:
                self.location_site_detail = self.load_location(site_code)
                self.site_id = self.load_site_id(site_code)
                self.sys_props = self.load_sys_props(site_code)

        except Exception as e:
            print(e)


    def process_state(self, msgdict):
        self.convertMeterToPixelCoordinates(msgdict)
        self.logger.logInfo('state:30', "After Coverting to pixel : {}".format(msgdict))
        if(len(msgdict['forkliftLocation']) > 0):
            self.logger.logInfo('state:34',"forkliftLocation is not null")
            locdict = msgdict['forkliftLocation']
            point_x = locdict['X']
            point_y = locdict['Y']
            locationid = self._findLocationId(point_y, point_x)
            self.logger.logDebug('state:28', 'location id found is {}'.format(locationid))
            if (locationid is None):


                invalidstatedict = {}

                epc = msgdict['EPC']

                locdict = msgdict['forkliftLocation']
                reason = "Location {} is invalid as it is not found inside any warehouse area".format(json.dumps(locdict))
                observationtime = msgdict['timestamp']
                invalidstatedict['epc'] = epc
                invalidstatedict['device_id'] = msgdict['ConeID']
                invalidstatedict['rfid_timestamp'] = observationtime
                invalidstatedict['reason'] = reason
                self._insert_invalid_event(invalidstatedict)

            else:
                self.process_epc_state(msgdict, locationid)
                self.process_forklift_state(msgdict, locationid)

        else:
            self.logger.logInfo('state:61', "toLocation is not null")
            locdict = msgdict['toLocation']
            point_x = locdict['X']
            point_y = locdict['Y']
            locationid = self._findLocationId(point_y, point_x)
            self.process_epc_state_for_toLocation(msgdict, locationid)

    def elapsedTimeGreaterThanSpecified(self):
        currentdatetime = datetime.datetime.now()
        dateTimeDifference = currentdatetime - self.lastdatetime
        dateTimeDifferenceinsec = dateTimeDifference.total_seconds()
        if(dateTimeDifferenceinsec > 300):
            self.lastdatetime = currentdatetime
            self.logger.logInfo('state:135', "15 min elapsed")
            return True
        else:
            return False

    def convertMeterToPixelCoordinates(self,msgdict):
        if self.elapsedTimeGreaterThanSpecified():
            if (self.use_redis == 'T'):
                self.sys_props = self.redis_conn.get('sys_props_{}'.format(self.site_code))
                if self.sys_props is not None:
                    self.logger.logDebug('state:124', 'sys_props is not none')
                    self.sys_props = json.loads(self.sys_props)
                    self.sys_props = pd.DataFrame(self.sys_props)

                if (self.sys_props is None):
                    self.logger.logDebug('state:124', 'sys_props is none')
                    self.sys_props = self.load_sys_props(self.site_code)
                    dpropDict = self.sys_props.to_dict('r')
                    dpropDict = json.dumps(dpropDict)
                    self.redis_conn.set('sys_props_{}'.format(self.site_code), dpropDict)
        tempdf=self.sys_props.loc[self.sys_props['name'] == 'meter_to_pixel']
        locdict=None
        if(len(msgdict['forkliftLocation']) > 0):
            locdict = msgdict['forkliftLocation']
        else:
            locdict = msgdict['toLocation']
        tempdict=tempdf['properties'].values[0]
        newPositionX = locdict['X']
        newPositionY = locdict['Y']
        pixelInitializerX = tempdict['pixelInitializerX']
        pixelInitializerY = tempdict['pixelInitializerY']
        initializer = tempdict['initializer']

        percentageChangeX = newPositionX / initializer
        percentageChangeY = newPositionY / initializer

        newPositionX = round(pixelInitializerX * percentageChangeX, 1)
        newPositionY = round(pixelInitializerY * percentageChangeY, 1)
        locdict['X']=newPositionX
        locdict['Y'] = newPositionY


    def load_event_matrix(self):
        with self.cursorfromconpool() as tup:
            conn = tup[1]
            sql = 'select \
                (select location_name from dhl_site_location where location_id = dlem.from_location_id)' \
                  '  from_location,\
                (select location_name from dhl_site_location where location_id = dlem.to_location_id)' \
                  '  to_location,\
                event\
                 from dhl_location_event_matrix dlem'
            dat = pd.read_sql_query(sql, conn)

            # Note the (email,) to make it a tuple!
            # cursor.execute('SELECT user_id, username, "password", email, created_on, last_login \
            # FROM public.account')
            # row = cursor.fetchone()
            # while row is not None:
            #     print(row)
            #     row = cursor.fetchone()
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
            print(e)
            print("dat@@@@@@@@@@@@@", dat)
        if dat is not None:
            self.logger.logDebug('state:91', 'locations are loaded {}'.format(dat.size))
        else:
            self.logger.logDebug('state:93', 'locations are not loaded and empty')

        return site_id
    def load_location(self,site_code):
        dat = None
        try:

            with self.cursorfromconpool() as tup:
                conn = tup[1]
                sql = "SELECT location_id, location_name, locationz, site_id, locationxy_coordinate, " \
                      "parent_location, is_logical ,is_multipolygon " \
                      "FROM public.dhl_site_location where is_logical='F' and location_name !='NA'" \
                      " and site_id=(select site_id from dhl_site where site_code ='{}') order by parent_location".format(site_code)
                dat = pd.read_sql_query(sql, conn)
                # print(dat)
                for i, row in dat.iterrows():
                    # print(i,row)
                    cordDict = dat['locationxy_coordinate'][i]
                    cord = cordDict['xy']
                    # row['locationxy_coordinate'] = list(map(tuple, cord))
                    dat.at[i, 'locationxy_coordinate'] = list(map(tuple, cord))
        except Exception as e:
            print(e)
            print("dat@@@@@@@@@@@@@", dat)
        if dat is not None:
            self.logger.logDebug('state:91', 'locations are loaded {}'.format(dat.size))
        else:
            self.logger.logDebug('state:93', 'locations are not loaded and empty')

        return dat

    def load_sys_props(self,site_code):
        dat = None
        try:

            with self.cursorfromconpool() as tup:
                conn = tup[1]
                sql = "select name, description, properties, site_id " \
                      "FROM public.dhl_system_properties where " \
                      " site_id=(select site_id from dhl_site where site_code ='{}')".format(site_code)
                dat = pd.read_sql_query(sql, conn)
                # print(dat)
        except Exception as e:
            print(e)
            print("dat@@@@@@@@@@@@@", dat)
        if dat is not None:
            self.logger.logDebug('state:91', 'locations are loaded {}'.format(dat.size))
        else:
            self.logger.logDebug('state:93', 'locations are not loaded and empty')

        return dat

    def process_epc_state(self, anchordic, locationid):
        if anchordic['EPC'] != "":

            epclst = anchordic['EPC'].split(',')
            epctupleupdate = []
            epctupleinsert = []
            for epc in epclst:
                epcrefno = self.hextoascii(epc)
                observationtime = anchordic['timestamp']
                deviceid = anchordic['ConeID']
                epcdf = self._read_epc_state_table(epc)
                locdict = anchordic['forkliftLocation']
                point_x = locdict['X']
                point_y = locdict['Y']
                now = time.time()
                mlsec = repr(now).split('.')[1][:3]
                datestr = datetime.datetime.utcnow().strftime('%Y-%m-%dT%H:%M:%S.{}Z'.format(mlsec))
                if (epcdf is not None):

                    epc_df = epcdf.copy()

                    lst = [point_y, point_x]

                    locationdata = '{{"xy":{}}}'.format(lst)
                    statedict = {}
                    epceventlogdict = {}
                    if epc_df.empty:
                        self.logger.logDebug('state:123', 'No EPC state found')
                        strfunction = "now_utc()"

                        epctupleupdate.append(
                            (epc, observationtime, locationid, self.site_id, deviceid,  locationdata, datestr,epcrefno,observationtime))
                        epctupleinsert.append((epc, 999999, locationid, observationtime, deviceid, self.site_id,locationdata,epcrefno))

                    else:

                        self.logger.logDebug('state:130', 'previous epc {} state found'.format(epc))
                        prev_state = epc_df.loc[epc_df['epc'] == epc]
                        if (prev_state.location_id.values[0] != locationid):
                            strfunction = "now_utc()"
                            epctupleupdate.append(
                                (epc, observationtime, locationid, self.site_id, deviceid, locationdata, datestr,epcrefno,observationtime))
                            epctupleinsert.append(
                                (epc, prev_state.location_id.values[0], locationid, observationtime, deviceid, self.site_id,locationdata,epcrefno))
                        else:
                            self.logger.logDebug('state:137',
                                                 'previous epc {} state location {} not changed '.format(epc,
                                                                                                         locationid))
            if (len(epctupleupdate) > 0):
                self._insert_and_update_epc_state_location(epctupleupdate, epctupleinsert)

    def process_forklift_state(self, anchordic, locationid):
        deviceid = anchordic['ConeID']
        locdict = anchordic['forkliftLocation']
        point_x = locdict['X']
        point_y = locdict['Y']
        observationtime = anchordic['timestamp']
        devicedf = self._read_forklift_state_table(deviceid)
        device_df = devicedf.copy()

        lst = [point_y, point_x]

        locationdata = '{{"xy":{}}}'.format(lst)
        statedict = {}
        epceventlogdict = {}
        if device_df.empty:

            self.logger.logDebug('state:157', 'No state found for forklift device {}'.format(deviceid))
            statedict['deviceid'] = deviceid
            statedict['locationxy'] = locationdata
            statedict['device_timestamp'] = observationtime
            statedict['location_id'] = locationid
            statedict['location_id'] = locationid

            epceventlogdict['deviceid'] = deviceid
            epceventlogdict['locationxy'] = locationdata
            epceventlogdict['device_timestamp'] = observationtime
            epceventlogdict['from_location_id'] = 999999
            epceventlogdict['to_location_id'] = locationid
            epceventlogdict['site_id'] = self.site_id
            self._insert_forklift_state_location(epceventlogdict, statedict)

        else:

            self.logger.logDebug('state:157', 'previous state found for forklift device {}'.format(deviceid))
            prev_state = device_df.loc[device_df['device_id'] == deviceid]
            statedict['deviceid'] = deviceid
            statedict['locationxy'] = locationdata
            statedict['device_timestamp'] = observationtime
            statedict['location_id'] = locationid

            epceventlogdict['deviceid'] = deviceid
            epceventlogdict['locationxy'] = locationdata
            epceventlogdict['device_timestamp'] = observationtime
            epceventlogdict['from_location_id'] = prev_state.location_id.values[0]
            epceventlogdict['to_location_id'] = locationid
            epceventlogdict['site_id'] = self.site_id
            if (prev_state.locationxy.values[0] != locationdata):
                self._insert_forklift_state_location(epceventlogdict, statedict)
            else:
                self.logger.logDebug('state:187',
                                     'previous forklift location not changed for device {}'.format(deviceid))

    def process_epc_state_for_toLocation(self, anchordic, locationid):
        if anchordic['EPC'] != "":

            epclst = anchordic['EPC'].split(',')
            epctupleupdate = []
            epctupleinsert = []
            for epc in epclst:
                epcrefno = self.hextoascii(epc)
                observationtime = anchordic['timestamp']
                deviceid = anchordic['ConeID']
                epcdf = self._read_epc_state_table(epc)
                locdict = anchordic['toLocation']
                point_x = locdict['X']
                point_y = locdict['Y']
                now = time.time()
                mlsec = repr(now).split('.')[1][:3]
                datestr = datetime.datetime.utcnow().strftime('%Y-%m-%dT%H:%M:%S.{}Z'.format(mlsec))
                if (epcdf is not None):

                    epc_df = epcdf.copy()

                    lst = [point_y, point_x]

                    locationdata = '{{"xy":{}}}'.format(lst)
                    statedict = {}
                    epceventlogdict = {}
                    epctupleupdate.append(
                        (epc, observationtime, locationid, self.site_id, deviceid,  locationdata, datestr,epcrefno,observationtime))

                    self._insert_and_update_epc_state_for_toLocation(epctupleupdate)



    def _findLocationId(self, Point_X, Point_Y):
        if self.elapsedTimeGreaterThanSpecified():
            if(self.use_redis=='T'):
                self.location_site_detail = self.redis_conn.get('loc_detail_{}'.format(self.site_code))
                if self.location_site_detail is not None:
                    self.logger.logDebug('state:385','location_site_detail is not none')
                    self.location_site_detail = json.loads(self.location_site_detail)
                    self.location_site_detail = pd.DataFrame(self.location_site_detail)
                if(self.location_site_detail is None):
                    self.logger.logDebug('state:389', 'location_site_detail is none')
                    self.location_site_detail = self.load_location(self.site_code)
                    dlocDict = self.location_site_detail.to_dict('r')
                    dlocDict = json.dumps(dlocDict)
                    self.redis_conn.set('loc_detail_{}'.format(self.site_code), dlocDict)


        dat = self.location_site_detail.copy()

        # self.logger.logDebug('state:194','location data are {}'.format(dat))
        locationid = None
        locationcord = None
        for ind in dat.index:

            polygon = dat['locationxy_coordinate'][ind]
            is_multipolygon=dat['is_multipolygon'][ind]
            # cord=cordDict['xy']
            # dat.loc[ind, "locationxy_coordinate"] = cord
            # polygon=list(map(tuple, cord))
            if is_multipolygon=='T':
                for i in range(len(polygon)):
                    print(polygon[i])
                    lst = list(map(tuple, polygon[i]))
                    line = geometry.LineString(lst)
                    point = geometry.Point(Point_X, Point_Y)
                    poly = geometry.Polygon(line)
                    if poly.contains(point):
                        locationid = dat['location_id'][ind]
                        break
                    elif line.contains(point):
                        locationid = dat['location_id'][ind]
                        break
            else:
                line = geometry.LineString(polygon)
                point = geometry.Point(Point_X, Point_Y)
                polygon = geometry.Polygon(line)
                if polygon.contains(point):
                    locationid = dat['location_id'][ind]
                    break
                elif line.contains(point):
                    locationid = dat['location_id'][ind]
                    break


        # if(locationid is None):
        #     tmpdat=dat.loc[dat['location_name'] == 'Putaway']
        #     if(tmpdat is not None):
        #         locationid = dat.loc[dat['location_name'] == 'Putaway'].location_id.values[0]



        return locationid

    def _read_epc_state_table(self, epc):
        # Query table to get records that match list of EPCs in the dataframe (SELECT * FROM TABLE WHERE ID IN (id1, id2, ..., idn))
        retrycount = 0
        df = None
        while True:

            with self.cursorfromconpool() as tup:

                conn = tup[1]
                # print(conn.closed)
                sql = "SELECT epc, TO_CHAR(rfid_timestamp,'YYYY-MM-DD HH24:MI:SS.MS') as rfid_timestamp,  location_id, site_id, device_id, reference_number," \
                      "updated_utc, locationxy, locationz " \
                      "FROM public.dhl_epc_state where epc='{}'".format(epc)
                try:
                    df = pd.read_sql_query(sql, conn)
                    break
                except psycopg2.OperationalError as error:
                    print(error)
                    time.sleep(.5)
                    retrycount += 1
                except (Exception, psycopg2.Error) as error:
                    retrycount += 1
                    # print(conn.closed)
                    if (conn.closed > 0):
                        self.logger.logInfo('state', 'Connection is not available')
                        self.reconnect()

            if (retrycount == 0 or retrycount == 4):
                break
            if (retrycount > 0 and retrycount < 4):
                continue

        return df

    def _read_forklift_state_table(self, deviceid):
        # Query table to get records that match list of EPCs in the dataframe (SELECT * FROM TABLE WHERE ID IN (id1, id2, ..., idn))
        with self.cursorfromconpool() as tup:
            conn = tup[1]
            sql = "SELECT device_id, TO_CHAR(device_timestamp,'YYYY-MM-DD HH24:MI:SS.MS') device_timestamp, location_id, site_id," \
                  "updated_utc, locationxy, locationz " \
                  "FROM public.dhl_forklift_device_state where device_id='{}'".format(deviceid)
            df = pd.read_sql_query(sql, conn)
        return df

    def _insert_and_update_epc_state_location(self, updatetuple, inserttuple):
        tuples_str_insert = ', '.join(map(str, inserttuple))
        tuples_str_update = ', '.join(map(str, updatetuple))
        retrycount = 0

        sqlupsert_insert = "INSERT INTO public.dhl_epc_event_log (epc, from_location_id, to_location_id, rfid_timestamp, device_id,site_id,locationxy_coordinate,reference_number) " \
                           " VALUES " \
                           " {} ".format(tuples_str_insert)
        sqlupsert_update = "INSERT INTO public.dhl_epc_state (epc, rfid_timestamp, location_id, site_id, device_id, " \
                           "locationxy,updated_utc,reference_number,warehouse_in_time) VALUES" \
                           " {} " \
                           "ON CONFLICT (epc) DO UPDATE " \
                           "SET locationxy=EXCLUDED.locationxy ,rfid_timestamp=EXCLUDED.rfid_timestamp" \
                           ",site_id=EXCLUDED.site_id,location_id=EXCLUDED.location_id,updated_utc=EXCLUDED.updated_utc,reference_number=EXCLUDED.reference_number".format(
            tuples_str_update)

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
                    if (conn.closed > 0):
                        self.logger.logInfo('state:275',
                                            'Connection is not available trying to reconnect {}'.format(error))
                        self.reconnect()
                    retrycount += 1
                except (Exception, psycopg2.Error) as error:
                    retrycount += 1
                    # print(conn.closed)
                    if (conn.closed > 0):
                        self.logger.logInfo('state:275',
                                            'Connection is not available trying to reconnect {}'.format(error))
                        self.reconnect()
            if (retrycount == 0 or retrycount == 4):
                break
            if (retrycount > 0 and retrycount < 4):
                continue

    def _insert_and_update_epc_state_for_toLocation(self, updatetuple):

        tuples_str_update = ', '.join(map(str, updatetuple))
        retrycount = 0

        sqlupsert_update = "INSERT INTO public.dhl_epc_state (epc, rfid_timestamp, location_id, site_id, device_id, " \
                           "locationxy,updated_utc,reference_number,warehouse_in_time) VALUES" \
                           " {} " \
                           "ON CONFLICT (epc) DO UPDATE " \
                           "SET locationxy=EXCLUDED.locationxy ,rfid_timestamp=EXCLUDED.rfid_timestamp" \
                           ",site_id=EXCLUDED.site_id,location_id=EXCLUDED.location_id,updated_utc=EXCLUDED.updated_utc,reference_number=EXCLUDED.reference_number".format(
            tuples_str_update)

        while True:

            with self.cursorfromconpool() as tup:
                cursor = tup[0]
                conn = tup[1]
                try:

                    cursor.execute(sqlupsert_update)

                    break
                except psycopg2.OperationalError as error:
                    # print(conn.closed)
                    if (conn.closed > 0):
                        self.logger.logInfo('state:275',
                                            'Connection is not available trying to reconnect {}'.format(error))
                        self.reconnect()
                    retrycount += 1
                except (Exception, psycopg2.Error) as error:
                    retrycount += 1
                    # print(conn.closed)
                    if (conn.closed > 0):
                        self.logger.logInfo('state:275',
                                            'Connection is not available trying to reconnect {}'.format(error))
                        self.reconnect()
            if (retrycount == 0 or retrycount == 4):
                break
            if (retrycount > 0 and retrycount < 4):
                continue


    def _insert_invalid_event(self, statedict):
        sqlupsert = "INSERT INTO public.dhl_invalid_event_log (epc,device_id,rfid_timestamp, reason) " \
                    " VALUES " \
                    "('{}','{}','{}','{}')".format(statedict['epc'],
                                                   statedict['device_id'],
                                                   statedict['rfid_timestamp'],
                                                   statedict['reason']

                                                   )
        with self.cursorfromconpool() as tup:
            cursor = tup[0]
            cursor.execute(sqlupsert)

    def _insert_forklift_state_location(self, insertdict, updatedict):
        retrycount = 0
        sqlinsert_event = "INSERT INTO public.dhl_forklift_device_event_log (device_id, from_location_id, to_location_id, device_timestamp,locationxy,site_id) " \
                          " VALUES " \
                          "('{}',{},{},'{}','{}','{}')".format(insertdict['deviceid'],
                                                     insertdict['from_location_id'],
                                                     insertdict['to_location_id'],
                                                     insertdict['device_timestamp'],
                                                     insertdict['locationxy'],
                                                     insertdict['site_id']

                                                     )
        sqlupdate_state = "INSERT INTO public.dhl_forklift_device_state (device_id, device_timestamp, location_id, site_id, " \
                          "locationxy,updated_utc) VALUES" \
                          "('{}','{}',{},{},'{}',now_utc()) " \
                          "ON CONFLICT (device_id) DO UPDATE " \
                          "SET locationxy=EXCLUDED.locationxy ,device_timestamp=EXCLUDED.device_timestamp" \
                          ",site_id=EXCLUDED.site_id,location_id=EXCLUDED.location_id,updated_utc=EXCLUDED.updated_utc".format(
            updatedict['deviceid'],
            updatedict['device_timestamp'],
            updatedict['location_id'], self.site_id,
            updatedict['locationxy'])

        while True:

            with self.cursorfromconpool() as tup:
                cursor = tup[0]
                conn = tup[1]
                try:

                    cursor.execute(sqlupdate_state)
                    cursor.execute(sqlinsert_event)
                    break
                except psycopg2.OperationalError as error:
                    # print(conn.closed)
                    if (conn.closed > 0):
                        self.logger.logInfo('state:275',
                                            'Connection is not available trying to reconnect {}'.format(error))
                        self.reconnect()
                    retrycount += 1
                except (Exception, psycopg2.Error) as error:
                    retrycount += 1
                    # print(conn.closed)
                    if (conn.closed > 0):
                        self.logger.logInfo('state:275',
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
    from dhl.logger.dhllogger import DHLlogger

    logger = DHLlogger('/root/IOT/project/dhl/trackntrace/log/trackntrace.log')
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

    # StateManagementProcess = StateManagement(CursorFromConnectionPool,'ORD','F',
    #                                          '127.0.0.1',
    #                                          '6379',
    #                                          '5mqNycoN7w',
    #                                          logger)
    StateManagementProcess = StateManagement(CursorFromConnectionPool,'ORD','F',
                                             'redis-14076.c9.us-east-1-2.ec2.cloud.redislabs.com',
                                             '14076',
                                             'Vuqize3ZRM3UXbGWOrEzpLAVhU6FieWG',
                                             logger)
    print(StateManagementProcess.location_site_detail)
    dicttemp = {"EPC": "444835363636363137335f313632", "fromLocation": {}, "toLocation": {},
                "forkliftLocation": {"X": 50, "Y": 52}, "timestamp": "2020-03-15T08:51:48.111Z",
                "ConeID": "anchor_tag_1"}
    StateManagementProcess.process_state(dicttemp)
