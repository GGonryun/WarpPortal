package services

import (
	"bytes"
	"encoding/json"
	"fmt"
	"log"
	"net/http"
	"os"
	"packages/kafra/settings"
)

type PortalService struct {
	config settings.Config
	logger settings.FileLogger
}

func NewPortalService(config settings.Config) *PortalService {
	return &PortalService{
		config: config,
		logger: settings.NewFileLogger(config),
	}
}

func (p *PortalService) Run(command string) {
	switch command {
	case "access":
		p.checkPortalAccess(false)
	case "bypass":
		p.checkPortalAccess(true)
	default:
		fmt.Printf("Unknown command for Portal Processor: %s\n", command)
	}
}

func (p *PortalService) checkPortalAccess(bypass bool) {
	if len(os.Args) != 6 {
		log.Println("Usage: portal access <key_type> <cert> <user>")
		os.Exit(1)
		return
	}

	keyType := os.Args[3]
	cert := os.Args[4]
	user := os.Args[5]

	// get the hostname of the machine we're running on

	hostname, err := os.Hostname()
	if err != nil {
		log.Println("Error getting hostname:", err)
		os.Exit(1)
		return
	}

	// check if any of the arguments are empty
	if keyType == "" || cert == "" || user == "" {
		log.Println("Error: all arguments must be non-empty")
		os.Exit(1)
		return
	}

	publicKey := fmt.Sprintf("%s %s %s", keyType, cert, user)

	err = p.logger.Write(fmt.Sprintf("Checking portal access for '%s' to server '%s' using public key '%s'", user, hostname, "<redacted>"))
	if err != nil {
		log.Println("Error writing to logs:", err)
		os.Exit(1)
		return
	}

	requestBody, err := json.Marshal(map[string]string{
		"public-key":  publicKey,
		"destination": hostname,
		"bypass":      fmt.Sprintf("%t", bypass),
	})
	if err != nil {
		log.Println("Error creating request body:", err)
		os.Exit(1)
		return
	}

	url := fmt.Sprintf("%s/portal/access", p.config.BulletinUrl)
	resp, err := http.Post(url, "application/json", bytes.NewBuffer(requestBody))
	if err != nil {
		log.Println("Error making request:", err)
		os.Exit(1)
		return
	}
	defer resp.Body.Close()

	if resp.StatusCode != http.StatusOK {
		log.Printf("Failed to process portal request: %s\n", resp.Status)
		os.Exit(1)
		return
	}

	var result PortalAccessResponse
	err = json.NewDecoder(resp.Body).Decode(&result)
	if err != nil {
		log.Println("Error reading response body:", err)
		os.Exit(1)
		return
	}

	msg := fmt.Sprintf("cert-authority %s", result.Authority)

	fmt.Println(msg)

	os.Exit(0)
}

type PortalAccessResponse struct {
	Authority string `json:"authority"`
}
