import getopt
import signal
import time
import sys
import json
import queue
import threading
try:
    import wiotp.sdk
except ImportError:
    # This part is only required to run the sample from within the samples
    # directory when the module itself is not installed.
    #
    # If you have the module installed, just use "import wiotp.sdk"
    import os
    import inspect

    cmd_subfolder = os.path.realpath(
        os.path.abspath(os.path.join(os.path.split(inspect.getfile(inspect.currentframe()))[0], "../../src"))
    )
    if cmd_subfolder not in sys.path:
        sys.path.insert(0, cmd_subfolder)
    import wiotp.sdk


tableRowTemplate = "%-33s%-30s%s"

q= queue.Queue(maxsize=100)
def mySubscribeCallback(mid, qos):
    if mid == statusMid:
        print("<< Subscription established for status messages at qos %s >> " % qos[0])
    elif mid == eventsMid:
        print("<< Subscription established for event messages at qos %s >> " % qos[0])


def myEventCallback(event):
    print("%-33s%-30s%s" % (event.timestamp.isoformat(), event.device, event.eventId + ": " + json.dumps(event.data)))
    # time.sleep(60)
    q.put(json.dumps(event.data))

def dqueue(q):
    while True:
        print("************************",q.get())

def myStatusCallback(status):
    if status.action == "Disconnect":
        summaryText = "%s %s (%s)" % (status.action, status.clientAddr, status.reason)
    else:
        summaryText = "%s %s" % (status.action, status.clientAddr)
    print(tableRowTemplate % (status.time.isoformat(), status.device, summaryText))


def interruptHandler(signal, frame):
    client.disconnect()
    sys.exit(0)


def usage():
    print(
        "simpleApp: Basic application connected to the Watson Internet of Things Platform."
        + "\n"
        + "\n"
        + "Options: "
        + "\n"
        + "  -h, --help          Display help information"
        + "\n"
        + "  -o, --organization  Connect to the specified organization"
        + "\n"
        + "  -i, --id            Application identifier (must be unique within the organization)"
        + "\n"
        + "  -k, --key           API key"
        + "\n"
        + "  -t, --token         Authentication token for the API key specified"
        + "\n"
        + "  -c, --config        Load application configuration file (ignore -o, -i, -k, -t options)"
        + "\n"
        + "  -T, --typeId        Restrict subscription to events from devices of the specified type"
        + "\n"
        + "  -I, --deviceId      Restrict subscription to events from devices of the specified id"
        + "\n"
        + "  -E, --event         Restrict subscription to a specific event"
    )


if __name__ == "__main__":
    signal.signal(signal.SIGINT, interruptHandler)

    try:
        print(sys.argv[1:])
        opts, args = getopt.getopt(
            sys.argv[1:],
            "h:o:i:k:t:c:T:I:E:",
            ["help", "org=", "id=", "key=", "token=", "config=", "typeId", "deviceId", "event"],
        )
        print(opts)
        print(args)
        opts=[('-o', 'nyjlzf'), ('-i', 'myApplication'), ('-k', 'a-nyjlzf-99ue2fhseu'), ('-t', 'ejQgsYPWPM7zAMAtKn'),('-T' ,'worker')]
        args=[('-o', 'nyjlzf'), ('-i', 'myApplication'), ('-k', 'a-nyjlzf-99ue2fhseu'), ('-t', 'ejQgsYPWPM7zAMAtKn'),('-T' ,'worker')]
    except getopt.GetoptError as err:
        print(str(err))
        usage()
        sys.exit(2)

    configFilePath = None
    typeId = "+"
    deviceId = "+"
    event = "+"

    # for o, a in opts:
    #     if o in ("-c", "--cfg"):
    #         configFilePath = a
    #     elif o in ("-T", "--typeId"):
    #         typeId = a
    #     elif o in ("-I", "--deviceid"):
    #         deviceId = a
    #     elif o in ("-E", "--event"):
    #         event = a
    #     elif o in ("-h", "--help"):
    #         usage()
    #         sys.exit()
    #     else:
    #         assert False, "unhandled option" + o

    client = None
    if configFilePath is not None:
        options = wiotp.sdk.application.parseConfigFile(configFilePath)
    else:
        options = wiotp.sdk.application.parseEnvVars()

    try:
        myConfig = {
            "auth":
        {

            "key": "a-nyjlzf-99ue2fhseu",
                   "token": "ejQgsYPWPM7zAMAtKn"
        },

                   "identity":{
            "appId": "myApplication1"
        }
        }
        client = wiotp.sdk.application.ApplicationClient(config=myConfig)
        # If you want to see more detail about what's going on, set log level to DEBUG
        # import logging
        # client.logger.setLevel(logging.DEBUG)
        client.connect()

    except wiotp.sdk.ConfigurationException as e:
        print(str(e))
        sys.exit()
    except wiotp.sdk.UnsupportedAuthenticationMethod as e:
        print(str(e))
        sys.exit()
    except wiotp.sdk.ConnectionException as e:
        print(str(e))
        sys.exit()

    print("(Press Ctrl+C to disconnect)")
    client.subscribeToDeviceEvents(typeId="worker", deviceId="workerzone", qos=1)

    client.subscribeToDeviceEvents(typeId="worker2", deviceId="workerzone2", qos=1)
    client.deviceEventCallback = myEventCallback
    client.deviceStatusCallback = myStatusCallback
    client.subscriptionCallback = mySubscribeCallback

    # statusMid = client.subscribeToDeviceStatus(typeId, deviceId)

    # eventsMid = client.subscribeToDeviceEvents(typeId, deviceId, event)


    print("=============================================================================")
    print(tableRowTemplate % ("Timestamp", "Device", "Event"))
    print("=============================================================================")
    # client.client.loop_forever()
    t2 = threading.Thread(target=dqueue, args=(q,))
    t2.start()
    t2.join()
    # while True:
    #     time.sleep(1)