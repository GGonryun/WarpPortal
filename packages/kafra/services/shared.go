package services

import (
	"fmt"
	"os"
	"os/exec"
)

func getEnvironment(key string, fallback string) string {
	value := os.Getenv(key)
	if value == "" {
		fmt.Printf("Environment variable %s not set, using fallback value %s\n", key, fallback)
		return fallback
	}
	return value
}

func execCommand(command []string) error {
	cmd := exec.Command(command[0], command[1:]...)
	cmd.Stdout = os.Stdout
	cmd.Stderr = os.Stderr
	return cmd.Run()
}
