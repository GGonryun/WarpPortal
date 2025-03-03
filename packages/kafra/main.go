package main

import (
	"flag"
	"fmt"
	"log"
	"os"
	"packages/kafra/services"
	"packages/kafra/settings"
)

func main() {
	flag.Parse()

	if len(flag.Args()) < 1 {
		fmt.Println("Usage: kafra <service> <command>")
		return
	}

	service := flag.Arg(0)

	config, err := settings.LoadConfig()
	if err != nil {
		log.Fatalf("Error loading config: %v", err)
		os.Exit(1)
		return
	}

	command := flag.Arg(1)

	switch service {
	case "proactive":
		s := services.NewProactiveService(config)
		s.Run(command)
	case "nss":
		s := services.NewNameSwitchService(config)
		s.Run(command)
	case "portal":
		s := services.NewPortalService(config)
		s.Run(command)
	case "session":
		s := services.NewSessionService(config)
		s.Run(command)
	case "register":
		s := services.NewRegistrationService(config)
		s.Run(command)
	case "install":
		s := services.NewInstallerService(config)
		s.Run()

	default:
		fmt.Printf("Unknown service: %s\n", service)
	}
}
