package auth

import (
	"crypto/rand"
	"encoding/hex"
	"fmt"
	"log"
	"os"
	"path/filepath"
	"strings"
)

const (
	SecretKeyFile   = "./data/secret.key"
	SecretKeyLength = 32 // 32字节 = 64个十六进制字符
)

var secretKey string

// InitSecretKey 初始化密钥
func InitSecretKey() error {
	// 确保 data 目录存在
	dataDir := "./data"
	if err := os.MkdirAll(dataDir, 0755); err != nil {
		return fmt.Errorf("failed to create data directory: %v", err)
	}

	// 检查密钥文件是否存在
	if _, err := os.Stat(SecretKeyFile); os.IsNotExist(err) {
		// 文件不存在，生成新密钥
		if err := generateAndSaveSecretKey(); err != nil {
			return fmt.Errorf("failed to generate secret key: %v", err)
		}
		log.Println("🔑 Generated new access key")
	} else {
		// File exists, load secret key
		if err := loadSecretKey(); err != nil {
			return fmt.Errorf("failed to load secret key: %v", err)
		}

		// Check if secret key is empty
		if strings.TrimSpace(secretKey) == "" {
			// Secret key is empty, regenerate
			if err := generateAndSaveSecretKey(); err != nil {
				return fmt.Errorf("failed to regenerate secret key: %v", err)
			}
			log.Println("🔑 Secret key file is empty, regenerated access key")
		} else {
			log.Println("🔑 Loaded existing access key")
		}
	}

	// Output secret key content
	log.Printf("🔐 Access key: %s", secretKey)
	return nil
}

// generateAndSaveSecretKey 生成并保存密钥
func generateAndSaveSecretKey() error {
	// 生成32字节的随机密钥
	keyBytes := make([]byte, SecretKeyLength)
	if _, err := rand.Read(keyBytes); err != nil {
		return fmt.Errorf("failed to generate random key: %v", err)
	}

	// 转换为十六进制字符串
	secretKey = hex.EncodeToString(keyBytes)

	// 保存到文件
	if err := os.WriteFile(SecretKeyFile, []byte(secretKey), 0600); err != nil {
		return fmt.Errorf("failed to save secret key file: %v", err)
	}

	return nil
}

// loadSecretKey 从文件加载密钥
func loadSecretKey() error {
	content, err := os.ReadFile(SecretKeyFile)
	if err != nil {
		return fmt.Errorf("failed to read secret key file: %v", err)
	}

	secretKey = strings.TrimSpace(string(content))
	return nil
}

// GetSecretKey 获取当前密钥
func GetSecretKey() string {
	return secretKey
}

// RegenerateSecretKey 重新生成密钥
func RegenerateSecretKey() error {
	if err := generateAndSaveSecretKey(); err != nil {
		return err
	}
	log.Printf("🔄 Regenerated access key: %s", secretKey)
	return nil
}

// GetSecretKeyFilePath 获取密钥文件路径
func GetSecretKeyFilePath() string {
	absPath, _ := filepath.Abs(SecretKeyFile)
	return absPath
}
