# Student Robotics CyanIDE

[![Travis CI](https://travis-ci.org/PeterJCLaw/srobo-ide.svg?branch=master)](https://travis-ci.org/PeterJCLaw/srobo-ide)
[![CircleCI](https://circleci.com/gh/PeterJCLaw/srobo-ide.svg?style=svg)](https://circleci.com/gh/PeterJCLaw/srobo-ide)

**CyanIDE** is a web-based IDE for developing code for Student Robotics robots.

Here's some basic info about the make targets:

`dev`: Sets up the base folders you'll need for the repos etc.

`docs`: Builds the docs according to the doxyfile.
        Currently this means html docs in html/ and latex docs in latex/

`lint-venv-config`: Creates a Python virtualenv at `lint-venv` with the linting
        requirements in and configures the IDE to use those for linting.

`package`: Creates a .deb that installs all the dependencies for srobo-ide

`clean`: Removes all of the above.

You can run tests on CyanIDE by running `./run-tests`.

## Dependencies

 * A web server (the PHP development one is fine for development)
 * PHP 7+ (likely works on PHP 5)
 * PHP-GD # for uploaded image resizing
 * PHP-LDAP # if using LDAP authentication
 * Git
 * doxygen # for building the docs.
 * PHP CLI # for running the tests.
 * python-requests # for running HTTP tests.
 * python-yaml # for building the export ZIPs
 * pylint  # syntax checker
 * php-ldap
 * NodeJS         # for running JS tests
 * Jasmine Node   # for running JS tests

In Ubuntu these can be achieved by installing the following packages:
 `php5 php5-gd doxygen php5-cli git-core nodejs`

While `pylint` can be installed globally, it is often preferable to install it
from PyPI to ensure you have a recent version. The easiest way to do this is
using a virtualenv. In Ubuntu this can be done by installing `python-virtualenv`
and then running `make lint-venv-config`.

Jasmine Node can be installed via npm:
 `npm install jasmine-node -g`

## Development Setup

You'll need to run `make dev` before the IDE will run correctly.

The PHP [development server][php-web-server] can be run via `php -S localhost:8000`.

By default you can login with any non-empty username and password.

[php-web-server]: https://www.php.net/manual/en/features.commandline.webserver.php

### Running with Docker

First install [Docker][docker-install] (and [optionally `docker-compose`][docker-compose-install]).

[docker-install]: https://docs.docker.com/get-docker/
[docker-compose-install]: https://docs.docker.com/compose/install/

If you just want to run the IDE without developing and without installing local 
requirements, you can build and run it in Docker.

```shell script
docker build -t srobo-ide:local .
docker run -d --network=host -t srobo-ide:local
```

Then visit http://localhost:8080

#### Developing in Docker

Alternatively you may want to actually develop with the code running in Docker. 
In order to do this, you will need to mount your code in the Docker container. You 
can then open a shell in the contain to run anything as you would locally. A
`docker-compose.yml` file is provided to help with this. 

The file `local_tests_config.py` will be mounted into `tests/http/localconfig.py`.

Manually:
```shell script
docker build -t srobo-ide:local .

# open a shell in the container and do whatever you want
# the steps are:
#   mount the current directory under /repo
#   mount the tests config in the right place
#   run as the current host user
#   use host networking (could do -p/-P here)
#   run bash instead of the php server
docker run \
  -v $(pwd):/repo \
  -v $(pwd)/local_tests_config.py:/repo/tests/http/localconfig.py \
  -u $(id -u ${USER}):$(id -g ${USER}) \
  --network=host \
  --entrypoint=/bin/bash \
  -it srobo-ide:local

# OR run the tests in the container directly
docker run \
  -v $(pwd):/repo \
  -v $(pwd)/local_tests_config.py:/repo/tests/http/localconfig.py \
  -u $(id -u ${USER}):$(id -g ${USER}) \
  --network=host \
  --entrypoint=/bin/bash \
  srobo-ide:local run-tests
```

With `docker-compose` and `make`:
*We can set the container user by setting the USER_GROUP environment variable to
`uid:gid`. If you skip this, the container will not be able to write to the host
directory.*

```shell script
# run the IDE in the container without mounting the host file system
docker-compose run ide  # make docker-run-ide

# OR open a shell in the container
USER_GROUP="$(id -u):$(id -g)" docker-compose run dev  # make docker-develop

# OR run the tests directly in the container
USER_GROUP="$(id -u):$(id -g)" docker-compose run dev run-tests # make docker-run-tests
```

### Apache HTTPD

Apache HTTPD is currently used for deployment, though it is expected that the
IDE will move to using a standalone PHP server (likely php-fpm directly behind
NGINX) as Apache is complicated to configure.

It is possible to use Apache HTTPD for development, however this is not encouraged.

## Authentication backends

There are three auth backends, configurable via the `auth_module` config key:

- `auto`: you are automatically logged in; there is only one user at a time,
  configured by `user.default`
- `single`: any non-empty username & password will log you in
- `ldap`: uses an LDAP server for authentication; configure using the various
  `ldap.*` configuration variables (see [`config/config.ini`](./config/config.ini)
  for configuration details).

  The easiest way to get a suitable LDAP server is to run either the
  [sr-dev-ldap][sr-dev-ldap] docker image or a local instance of the SR puppeted
  [volunteer services VM][server-puppet].

[server-puppet]: https://github.com/srobo/server-puppet/
[sr-dev-ldap]: https://hub.docker.com/r/peterjclaw/sr-dev-ldap

## Useful links

 * [CONTRIBUTING.md](./CONTRIBUTING.md)
 * [DESIGN.md](./DESIGN.md) (backend design notes)
 * [IDE research: putting objects in databases](https://groups.google.com/forum/#!topic/srobo-devel/vvKaEUQVOXo/discussion) (experimentation towards a MySQL backend for the git repos)


## Bee

```
                                  ...vvvv)))))).
       /~~\               ,,,c(((((((((((((((((/
      /~~c \.         .vv)))))))))))))))))))\``
          G_G__   ,,(((KKKK//////////////'
        ,Z~__ '@,gW@@AKXX~MW,gmmmz==m_.
       iP,dW@!,A@@@@@@@@@@@@@@@A` ,W@@A\c
       ]b_.__zf !P~@@@@@*P~b.~+=m@@@*~ g@Ws.
          ~`    ,2W2m. '\[ ['~~c'M7 _gW@@A`'s
            v=XX)====Y-  [ [    \c/*@@@*~ g@@i
           /v~           !.!.     '\c7+sg@@@@@s.
          //              'c'c       '\c7*X7~~~~
         ]/                 ~=Xm_       '~=(Gm_.

    i'm covered in beeeees and ldap
```
