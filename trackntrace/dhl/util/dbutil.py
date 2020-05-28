from psycopg2 import pool


class DHLDatabase:

    __connection_pool = None

    @staticmethod
    def initialise(**kwargs):
        DHLDatabase.__connection_pool = pool.SimpleConnectionPool(1, 10, **kwargs)

    @staticmethod
    def get_connection():
        return DHLDatabase.__connection_pool.getconn()

    @staticmethod
    def return_connection(connection):
        DHLDatabase.__connection_pool.putconn(connection)

    @staticmethod
    def close_all_connections():
        DHLDatabase.__connection_pool.closeall()

class CursorFromConnectionPool:
    def __init__(self):
        self.conn = None
        self.cursor = None

    def __enter__(self):
        self.conn = DHLDatabase.get_connection()
        self.cursor = self.conn.cursor()
        return self.cursor,self.conn

    def __exit__(self, exception_type, exception_value, exception_traceback):
        if exception_value:  # This is equivalent to `if exception_value is not None`
            if(self.conn.closed < 1):
                self.conn.rollback()
        else:
            if (self.conn.closed < 1):
                self.cursor.close()
                self.conn.commit()
        if(self.conn.closed < 1):
            DHLDatabase.return_connection(self.conn)
