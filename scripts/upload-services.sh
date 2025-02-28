#!/bin/bash
HOST_IP=
USER_IDENTITY=miguel

SERVICE_ROOT=$HOME/src/warpportal
CERTIFICATE_ROOT=$SERVICE_ROOT/certificates
DIST_ROOT=$SERVICE_ROOT/dist
PACKAGES_ROOT=$SERVICE_ROOT/packages

BUILD_SUFFIX=-linux-amd64

CERTIFICATE_FILE_PATH=$CERTIFICATE_ROOT/miguel-cert.pub
PRIVATE_KEY_FILE_PATH=$CERTIFICATE_ROOT/miguel
PUBLIC_KEY_FILE_PATH=$CERTIFICATE_ROOT/miguel.pub
ROOT_CERT_FILE_PATH=$CERTIFICATE_ROOT/warp-ca

echo "🔍 Checking files"
if [ ! -f "$PRIVATE_KEY_FILE_PATH" ]; then
    echo "Private key file not found!"
    exit 1
fi
echo "🎉 Private key file found!"
if [ ! -f "$CERTIFICATE_FILE_PATH" ]; then
    echo "Certificate file not found!"
    exit 1
fi
echo "🎉 Certificate file found!"

# resign our certificate
echo "🔐 Resigning certificate"
ssh-keygen -s $ROOT_CERT_FILE_PATH -I $PRIVATE_KEY_FILE_PATH -n $USER_IDENTITY -V +1h -z 1 $PUBLIC_KEY_FILE_PATH
echo "🎉 Certificate resigned!"


# for every service build and upload
SERVICES=(
    "kafra"
)
for SERVICE in "${SERVICES[@]}"
do
    OUTPUT_FILE=$DIST_ROOT/$SERVICE$BUILD_SUFFIX
    INPUT_FILE=$PACKAGES_ROOT/$SERVICE/main.go

    echo "📦 Building $SERVICE"
    GOOS=linux GOARCH=amd64 go build -o $OUTPUT_FILE $INPUT_FILE
    echo "🎉 $SERVICE built!"

    echo "🚀 Publishing $SERVICE"
    scp -i $PRIVATE_KEY_FILE_PATH -o CertificateFile=$CERTIFICATE_FILE_PATH $OUTPUT_FILE $USER_IDENTITY@$HOST_IP:~/
    # check if scp failed.
    if [ $? -ne 0 ]; then
        echo "❌ Failed to publish $SERVICE"
        exit 1
    else
        echo "🎉 $SERVICE published!"
    fi
done
echo "🎉 All services published!"