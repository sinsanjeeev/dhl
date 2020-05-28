import json
import logging

import sys
import wiotp.sdk


class MQTTHelper:
    def __init__(self, org_id, device_list, mqttconfig, logger=None):
        super().__init__()
        if logger:
            self.logger = logger
        else:
            self.logger = logging.getLogger(__name__)

        self.org_id = org_id
        self.device_list = device_list.split(',')
        self.mqttconfig = mqttconfig
        self.client = self.initialize_mqtt_clients()

    def initialize_mqtt_clients(self):

        self.client = wiotp.sdk.application.ApplicationClient(config=self.mqttconfig)
        self.client.connect()
        # self.client.deviceEventCallback = self.myEventCallback
        try:
            for deviceinfo in self.device_list:
                device = deviceinfo.split(':')
                device_type = device[0]
                device_id = device[1]
                self.client.subscribeToDeviceEvents(typeId=device_type, deviceId=device_id, qos=1)
            return self.client
        except wiotp.sdk.ConfigurationException as e:
            print(str(e))
            sys.exit()
        except wiotp.sdk.UnsupportedAuthenticationMethod as e:
            print(str(e))
            sys.exit()
        except wiotp.sdk.ConnectionException as e:
            print('*******************************************', str(e))
            sys.exit()

    def myEventCallback(self, event):
        print(
            "%-33s%-30s%s" % (event.timestamp.isoformat(), event.device, event.eventId + ": " + json.dumps(event.data)))

    def getClient(self):
        return self.client
