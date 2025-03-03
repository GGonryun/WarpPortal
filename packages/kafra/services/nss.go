package services

import (
	"encoding/json"
	"fmt"
	"net/http"
	"packages/kafra/settings"

	"github.com/gin-gonic/gin"
)

type NameSwitchService struct {
	config settings.Config
	logger settings.FileLogger
}

func NewNameSwitchService(config settings.Config) *NameSwitchService {
	return &NameSwitchService{
		config: config,
		logger: settings.NewFileLogger(config),
	}
}

func (n *NameSwitchService) Run(command string) {
	switch command {
	case "start":
		n.startNameServiceSwitchProxy()
	default:
		fmt.Printf("Unknown command for NameServiceSwitchProxy: %s\n", command)
	}
}

func (n *NameSwitchService) startNameServiceSwitchProxy() {
	r := gin.Default()
	gin.SetMode(gin.DebugMode)

	r.GET("/passwd", n.getPasswd)
	r.GET("/group", n.getGroup)
	r.GET("/shadow", n.getShadow)

	r.Run("localhost:9669")
}

func (n *NameSwitchService) fetchFromBulletin(endpoint string, c *gin.Context, result any) error {
	url := fmt.Sprintf("%s/%s?%s", n.config.BulletinUrl, endpoint, c.Request.URL.RawQuery)
	resp, err := http.Get(url)
	if err != nil {
		return err
	}
	defer resp.Body.Close()

	if resp.StatusCode != http.StatusOK {
		return fmt.Errorf("received non-200 response code: %d", resp.StatusCode)
	}

	return json.NewDecoder(resp.Body).Decode(result)
}

func (n *NameSwitchService) getPasswd(c *gin.Context) {
	var passwdData any
	if err := n.fetchFromBulletin("guild/passwd", c, &passwdData); err != nil {
		c.JSON(http.StatusInternalServerError, gin.H{"error": err.Error()})
		return
	}
	c.JSON(http.StatusOK, passwdData)
}

func (n *NameSwitchService) getGroup(c *gin.Context) {
	var groupData any
	if err := n.fetchFromBulletin("guild/group", c, &groupData); err != nil {
		c.JSON(http.StatusInternalServerError, gin.H{"error": err.Error()})
		return
	}
	c.JSON(http.StatusOK, groupData)
}

func (n *NameSwitchService) getShadow(c *gin.Context) {
	var shadowData any
	if err := n.fetchFromBulletin("guild/shadow", c, &shadowData); err != nil {
		c.JSON(http.StatusInternalServerError, gin.H{"error": err.Error()})
		return
	}
	c.JSON(http.StatusOK, shadowData)
}
