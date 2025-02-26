package services

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
