package services

import (
	"bytes"
	"encoding/json"
	"fmt"
	"log"
	"net/http"
	"os"
)

func PortalProcessor(command string) {
	switch command {
	case "access":
		checkPortalAccess()
	default:
		fmt.Printf("Unknown command for Portal Processor: %s\n", command)
	}
}

func checkPortalAccess() {
	if len(os.Args) != 5 {
		log.Println("Usage: portal access <key_type> <cert> <user>")
		os.Exit(1)
		return
	}

	keyType := os.Args[2]
	cert := os.Args[3]
	user := os.Args[4]

	log.Printf("Checking portal access for user: %s", user)

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

	requestBody, err := json.Marshal(map[string]string{
		"public-key":  fmt.Sprintf("%s %s %s", keyType, cert, user),
		"destination": hostname,
	})
	if err != nil {
		log.Println("Error creating request body:", err)
		os.Exit(1)
		return
	}

	url := fmt.Sprintf("%s/portal/access", PronteraUrl)
	resp, err := http.Post(url, "application/json", bytes.NewBuffer(requestBody))
	if err != nil {
		log.Println("Error making request:", err)
		os.Exit(1)
		return
	}
	defer resp.Body.Close()

	var result any
	err = json.NewDecoder(resp.Body).Decode(result)
	if err != nil {
		log.Println("Error reading response body:", err)
		os.Exit(1)
		return
	}

	fmt.Println(result)
}
