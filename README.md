This is Student Robotics CyanIDE.

[![Travis CI](https://travis-ci.org/PeterJCLaw/srobo-ide.svg?branch=master)](https://travis-ci.org/PeterJCLaw/srobo-ide)
[![CircleCI](https://circleci.com/gh/PeterJCLaw/srobo-ide.svg?style=svg)](https://circleci.com/gh/PeterJCLaw/srobo-ide)

It is a web-based IDE for developing code for Student Robotics robots.

If you're using devmode and you hate apache for development then you'll find a lighttpd
configuration file in this directory. Just run `lighttpd -f lighttpd.config -D` to get
devmode.

Here's some basic info about the make targets:

`dev`: Sets up the base folders you'll need for the repos etc.

`docs`: Builds the docs according to the doxyfile.
        Currently this means html docs in html/ and latex docs in latex/

`clean`: Removes both of the above.

`package`: Creates a .deb that installs all the dependencies for srobo-ide

You can run tests on CyanIDE by running `./run-tests`.

Dependencies:
 * A web server
 * PHP 5.5+
 * PHP-GD # for uploaded image resizing
 * PHP-LDAP # if using LDAP authentication
 * Git
 * doxygen # for building the docs.
 * PHP CLI # for running the tests.
 * python-poster # for running HTTP tests.
 * python-yaml # for building the export ZIPs
 * pylint  # syntax checker
 * php-ldap
 * NodeJS         # for running JS tests
 * Jasmine Node   # for running JS tests

In Ubuntu these can be achieved by installing the following packages:
 apache2 php5 php5-gd doxygen php5-cli git-core pylint nodejs

Jasmine Node can be installed via npm:
 npm install jasmine-node -g

Note that by default Ubuntu Lucid will not execute PHP files in
public_html folders. This can be resolved by following the instructions
in /etc/apache2/mods-available/php5.conf

You'll then need to restart apache for those changes to take effect..

Other useful files:
 * [CONTRIBUTING.md](./CONTRIBUTING.md)
 * [DESIGN.md](./DESIGN.md)

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
