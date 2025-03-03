package services

import (
	"bytes"
	"encoding/json"
	"fmt"
	"net/http"
	"os"
	"os/exec"
	"packages/kafra/settings"
)

type RegistrationService struct {
	config settings.Config
	logger settings.FileLogger
}

func NewRegistrationService(config settings.Config) *RegistrationService {
	return &RegistrationService{
		config: config,
		logger: settings.NewFileLogger(config),
	}
}

func (r *RegistrationService) Run(command string) {
	switch command {
	case "destination":
		r.registerDestination()
	default:
		fmt.Printf("Unknown command for Registration Processor: %s\n", command)
	}
}

func (r *RegistrationService) registerDestination() {
	r.logger.Write("Registering destination...")

	hostname, err := os.Hostname()
	if err != nil {
		r.logger.Write(fmt.Sprintf("Error getting hostname: %v", err))
		return
	}

	cmd := exec.Command("curl", "-s", "ifconfig.me")
	output, err := cmd.Output()
	if err != nil {
		r.logger.Write(fmt.Sprintf("Error getting public IP address: %v", err))
		return
	}

	ip := string(output)

	data := map[string]string{
		"hostname": hostname,
		"ip":       ip,
	}

	jsonData, err := json.Marshal(data)
	if err != nil {
		r.logger.Write(fmt.Sprintf("Error marshalling JSON: %v", err))
		return
	}
	url := fmt.Sprintf("%s%s", r.config.BulletinUrl, "/portal/register")

	resp, err := http.Post(url, "application/json", bytes.NewBuffer(jsonData))
	if err != nil {
		r.logger.Write(fmt.Sprintf("Error making POST request: %v", err))
		return
	}
	defer resp.Body.Close()

	if resp.StatusCode != http.StatusOK {
		r.logger.Write(fmt.Sprintf("Received non-OK response: %v", resp.Status))
		return
	}

	r.logger.Write("Successfully registered destination")
}
