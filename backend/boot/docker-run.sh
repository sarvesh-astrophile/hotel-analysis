#! /bin/bash

source /opt/venv/bin/activate

cd /code

python database.py

# Set the default values for RUN_PORT and RUN_HOST
RUN_PORT=${RUN_PORT:-8000}
RUN_HOST=${RUN_HOST:-0.0.0.0}

# run the gunicorn server
gunicorn -k uvicorn.workers.UvicornWorker -b $RUN_HOST:$RUN_PORT src.main:app


