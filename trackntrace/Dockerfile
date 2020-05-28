# Dockerfile to run the sample under current Python 3
#
# docker build -t python-rdkafka
# docker run --rm -it -e VCAP_SERVICES=${VCAP_SERVICES} python-rdkafka
# OR
# docker run --rm -it python-rdkafka <kafka_brokers_sasl> <kafka_admin_url> <api_key> <ca_location>
#
# FROM python:3.6-stretch

FROM continuumio/miniconda3@sha256:58b9c633f81f26dc8be8d73aabc3f8e87fb3dcde54066d8f6f64cf42114daebc

RUN apt-get update --fix-missing && \
  apt-get install -y gcc libxml2 && \
  apt-get clean && \
  apt-get install -y libpq-dev python3-dev && \
  rm -rf /var/lib/apt/lists/*

RUN pip install --upgrade pip


# RUN pip install --upgrade --user git+https://4e2fd1d8716cd68c41c28ed5177e9358c841fbb1@github.ibm.com/Watson-IoT/enrichment-functions.git@ --no-cache

WORKDIR /usr/src/app

COPY requirements.txt /usr/src/app

RUN pip install -r requirements.txt

COPY . /usr/src/app

ENTRYPOINT [ "/opt/conda/bin/python", "-u", "app.py" ]
CMD [ "" ]
