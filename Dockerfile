FROM circleci/php:7.2-node

USER root

RUN apt update && \
    apt install python-requests \
                python-pip \
                python-virtualenv \
                python-yaml \
                libpng-dev 

RUN npm install --global jasmine-node

RUN docker-php-ext-install gd pcntl

COPY ./ /repo

WORKDIR /repo

RUN python --version \
    && pip install -r pylint-requirements.txt \
    && echo "pylint.path = $(which pylint)" >> config/automagic.ini \
    && echo "python.path = $(which python)" >> config/automagic.ini \
    && cat config/automagic.ini

RUN echo 'URL = "http://localhost:8000/"' > tests/http/localconfig.py

RUN make dev

USER circleci

EXPOSE 8000

ENTRYPOINT ["php", "-S", "localhost:8000"]
