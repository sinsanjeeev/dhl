import logging
from logging import handlers
import os
import sys
class DHLlogger:
    def __init__(self,path):
        self.log = logging.getLogger('main')
        log_level = os.getenv("LOG_LEVEL", None)
        self.level=logging.getLevelName(log_level)
        self.log.setLevel(self.level)
        self.ch = logging.handlers.RotatingFileHandler(
            path, maxBytes=10485760, backupCount=10)  # max size of 10Mb and 1 backup
        self.ch.setLevel(self.level)
        self.chFormatter = logging.Formatter(
            '%(asctime)-25s %(name)-30s' + ' %(levelname)-8s %(message)s')
        self.ch.setFormatter(self.chFormatter)
        self.log.addHandler(self.ch)

        consoleHandler = logging.StreamHandler(sys.stdout)
        consoleHandler.setFormatter(self.chFormatter)
        self.log.addHandler(consoleHandler)

    def logInfo(self,modname,msg):
        self.log.name=modname
        self.log.info(msg)
    def logDebug(self,modname,msg):
        self.log.name = modname
        self.log.debug(msg)
    def logError(self, modname, msg):
        self.log.name = modname
        self.log.error(msg)
    def logException(self, modname, msg):
        self.log.name = modname
        self.log.exception(msg)

    def logWarn(self, modname, msg):
        self.log.name = modname
        self.log.warning(msg)

    def setLogLevel(self, level):
        self.ch.setLevel(level)