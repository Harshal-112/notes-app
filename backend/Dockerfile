FROM python:3.13.1-slim

WORKDIR /app

COPY . .

RUN pip install -r requirements.txt

EXPOSE 8000

CMD ["sh", "-c", "python manage.py migrate && gunicorn wsgi:application --bind 0.0.0.0:8000 --workers 3"]
