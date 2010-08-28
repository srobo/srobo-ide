_REPOS = repos/1 repos/2

_JAVA_KEYSTORE = applet/.keystore
_JAVA_KEYSTORE_PWD = testpass

.PHONY: all default dev docs clean applet

# Useful groupings
default: dev
all: dev docs applet

applet: applet/build.xml
	cd applet/ && ant build

# Actual targets
clean:
	rm -rf repos html latex
	rm -f applet/.keystore
	cd applet/ && ant clean

dev: $(_REPOS)

docs:
	doxygen doxyfile

# Helpers
applet/.keystore:
	keytool -genkeypair -keyalg rsa -alias test-only-applet-key \
	-storepass $(_JAVA_KEYSTORE_PWD) -keypass $(_JAVA_KEYSTORE_PWD) \
	-dname "cn=Test User, ou=SR, o=SR, c=UK" -keystore $(_JAVA_KEYSTORE)

$(_REPOS):
	mkdir -p $@
	chmod a+rwx $@

