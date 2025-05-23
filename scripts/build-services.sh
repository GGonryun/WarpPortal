#!/bin/bash

SERVICE_ROOT=$HOME/src/warpportal
DIST_ROOT=$SERVICE_ROOT/dist
PACKAGES_ROOT=$SERVICE_ROOT/packages

BUILD_FOLDER=linux-amd64

# for every service build and upload
SERVICES=(
    "kafra"
)
for SERVICE in "${SERVICES[@]}"
do
    OUTPUT_FILE=$DIST_ROOT/$BUILD_FOLDER/$SERVICE
    INPUT_FILE=$PACKAGES_ROOT/$SERVICE/main.go

    echo "📦 Building $SERVICE"
    GOOS=linux GOARCH=amd64 go build -o $OUTPUT_FILE $INPUT_FILE
    echo "🎉 $SERVICE built!"

done
echo "🎉 All services built!"