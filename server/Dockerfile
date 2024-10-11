FROM python:3.12.5

WORKDIR /

COPY requirements.txt .
RUN pip install --upgrade pip
RUN pip install -r requirements.txt

COPY . .
RUN mkdir -p /root/.postgresql
COPY certs/root.crt /root/.postgresql/root.crt

EXPOSE 8000

CMD ["uvicorn", "main:app", "--host", "0.0.0.0", "--port", "8000"]