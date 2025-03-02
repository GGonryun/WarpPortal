package main

import (
	"bytes"
	"crypto/rand"
	"crypto/rsa"
	"crypto/x509"
	"encoding/json"
	"encoding/pem"
	"fmt"
	"io"
	"log"
	"net/http"
	"os"
	"path/filepath"

	"golang.org/x/crypto/ssh"
)

// duped from kafra.
func getEnvironment(key string, fallback string) string {
	value := os.Getenv(key)
	if value == "" {
		// fmt.Printf("Environment variable %s not set, using fallback value %s\n", key, fallback)
		return fallback
	}
	return value
}

var PRONTERA_URL = getEnvironment("PRONTERA_URL", "http://localhost:3333")
var CONFIG_PATH = getEnvironment("CONFIG_PATH", "/Users/miguelcampos/.warp")

func main() {
	if len(os.Args) < 2 {
		log.Fatalf("Usage: %s <command>", os.Args[0])
	}

	command := os.Args[1]

	switch command {
	case "certificate":
		issueCertificate()
	case "resolve":
		if len(os.Args) != 3 {
			log.Fatalf("Usage: %s resolve <hostname>", os.Args[0])
		}
		resolveTarget(os.Args[2])
	case "login":
		if len(os.Args) != 3 {
			log.Fatalf("Usage: %s login <email>", os.Args[0])
		}
		login(os.Args[2])
	default:
		log.Fatalf("Unknown command: %s", command)
	}
}

func issueCertificate() {
	user, err := loadUserConfig()
	if err != nil {
		log.Fatalf("Failed to load user config: %v", err)
	}

	if _, err := os.Stat(CONFIG_PATH); os.IsNotExist(err) {
		fmt.Printf("Creating config directory: %s\n", CONFIG_PATH)
		os.MkdirAll(CONFIG_PATH, 0700)
	}

	privateKeyPath := filepath.Join(CONFIG_PATH, "id_rsa")
	publicKeyPath := privateKeyPath + ".pub"
	certPath := filepath.Join(CONFIG_PATH, "cert.pub")

	if _, err := os.Stat(privateKeyPath); os.IsNotExist(err) {
		fmt.Printf("Generating new keys at %s and %s\n", privateKeyPath, publicKeyPath)
		generateKeys(privateKeyPath, publicKeyPath)
	}

	publicKey, err := os.ReadFile(publicKeyPath)
	if err != nil {
		log.Fatalf("Failed to read public key: %v", err)
	}

	fmt.Printf("Requesting certificate for %s\n", user.Email)
	cert, err := requestCertificate(string(publicKey), user.Email)
	if err != nil {
		log.Fatalf("Failed to request certificate: %v", err)
		return
	}

	os.WriteFile(certPath, []byte(cert), 0644)
	fmt.Printf("Certificate saved to %s\n", certPath)
}

func resolveTarget(hostname string) {
	user, err := loadUserConfig()
	if err != nil {
		log.Fatalf("Failed to load user config: %v", err)
	}

	info, err := requestTargetInfo(user.Email, hostname)
	if err != nil {
		log.Fatalf("Failed to get access info: %v", err)
		return
	}

	sshCommand := fmt.Sprintf("ssh -i %s -o CertificateFile=%s %s", filepath.Join(CONFIG_PATH, "id_rsa"), filepath.Join(CONFIG_PATH, "cert.pub"), info.Target)
	fmt.Println(sshCommand)
}

type User struct {
	Email string `json:"email"`
}

func login(email string) {
	emailPath := filepath.Join(CONFIG_PATH, "email.json")
	user := User{Email: email}
	data, err := json.Marshal(user)
	if err != nil {
		log.Fatalf("Failed to marshal user data: %v", err)
	}
	if err := os.WriteFile(emailPath, data, 0644); err != nil {
		log.Fatalf("Failed to save email: %v", err)
	}
	fmt.Printf("Email %s saved to %s\n", email, emailPath)
}

func generateKeys(privateKeyPath, publicKeyPath string) {
	privateKey, err := rsa.GenerateKey(rand.Reader, 4096)
	if err != nil {
		log.Fatalf("Failed to generate private key: %v", err)
	}

	privateKeyFile, err := os.Create(privateKeyPath)
	if err != nil {
		log.Fatalf("Failed to create private key file: %v", err)
	}
	defer privateKeyFile.Close()

	privateKeyPEM := pem.EncodeToMemory(&pem.Block{
		Type:  "RSA PRIVATE KEY",
		Bytes: x509.MarshalPKCS1PrivateKey(privateKey),
	})
	privateKeyFile.Write(privateKeyPEM)
	// update permissions
	os.Chmod(privateKeyPath, 0600)

	publicKeyFile, err := os.Create(publicKeyPath)
	if err != nil {
		log.Fatalf("Failed to create public key file: %v", err)
	}
	defer publicKeyFile.Close()

	publicKey, err := ssh.NewPublicKey(&privateKey.PublicKey)
	if err != nil {
		log.Fatalf("Failed to create public key: %v", err)
		return
	}

	publicKeyFile.Write(ssh.MarshalAuthorizedKey(publicKey))
}

func requestCertificate(publicKey, email string) (string, error) {
	requestBody, err := json.Marshal(map[string]string{
		"public-key": publicKey,
		"email":      email,
	})
	if err != nil {
		return "", err
	}

	resp, err := http.Post(PRONTERA_URL+"/portal/issue",
		"application/json",
		bytes.NewBuffer(requestBody),
	)
	if err != nil {
		return "", err
	}
	defer resp.Body.Close()

	response, err := io.ReadAll(resp.Body)
	if err != nil {
		return "", err
	}

	result := string(response)

	if resp.StatusCode != http.StatusOK {
		return "", fmt.Errorf("[%s] Failed to request certificate: %s", resp.Status, result)
	}

	return result, nil
}

func requestTargetInfo(email, hostname string) (TargetInfo, error) {
	empty := TargetInfo{Target: ""}

	resp, err := http.Get(fmt.Sprintf("%s/portal/target?email=%s&hostname=%s", PRONTERA_URL, email, hostname))
	if err != nil {
		return empty, err
	}
	defer resp.Body.Close()

	if resp.StatusCode != http.StatusOK {
		return empty, fmt.Errorf("[%s] Failed to get access target", resp.Status)
	}

	var target TargetInfo
	if err := json.NewDecoder(resp.Body).Decode(&target); err != nil {
		return empty, err
	}

	return target, nil
}

type TargetInfo struct {
	Target string `json:"target"`
}

func loadUserConfig() (User, error) {
	emailPath := filepath.Join(CONFIG_PATH, "email.json")
	data, err := os.ReadFile(emailPath)
	if err != nil {
		return User{}, fmt.Errorf("failed to read email config: %w", err)
	}

	var user User
	if err := json.Unmarshal(data, &user); err != nil {
		return User{}, fmt.Errorf("failed to unmarshal email config: %w", err)
	}

	return user, nil
}
