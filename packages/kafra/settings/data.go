package settings

import (
	"fmt"
	"os"
)

func getEnvironment(key string, fallback string) string {
	value := os.Getenv(key)
	if value == "" {
		fmt.Printf("Environment variable %s not set, using fallback value %s\n", key, fallback)
		return fallback
	}
	return value
}

var BULLETIN_URL = getEnvironment("BULLETIN_URL", "http://localhost:3333")
var LOG_FILE_PATH = getEnvironment("LOG_FILE_PATH", "/var/log/kafra.log")
var REDIS_ADDRESS = getEnvironment("REDIS_ADDRESS", "localhost:6379")
var REDIS_CHANNEL_ID = getEnvironment("REDIS_CHANNEL_ID", "kafra")
