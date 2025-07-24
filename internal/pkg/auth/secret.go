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
	SecretKeyFile = "./data/secret.key"
	SecretKeyLength = 32 // 32字节 = 64个十六进制字符
)

var secretKey string

// InitSecretKey 初始化密钥
func InitSecretKey() error {
	// 确保 data 目录存在
	dataDir := "./data"
	if err := os.MkdirAll(dataDir, 0755); err != nil {
		return fmt.Errorf("创建 data 目录失败: %v", err)
	}

	// 检查密钥文件是否存在
	if _, err := os.Stat(SecretKeyFile); os.IsNotExist(err) {
		// 文件不存在，生成新密钥
		if err := generateAndSaveSecretKey(); err != nil {
			return fmt.Errorf("生成密钥失败: %v", err)
		}
		log.Println("🔑 已生成新的访问密钥")
	} else {
		// 文件存在，读取密钥
		if err := loadSecretKey(); err != nil {
			return fmt.Errorf("加载密钥失败: %v", err)
		}
		
		// 检查密钥是否为空
		if strings.TrimSpace(secretKey) == "" {
			// 密钥为空，重新生成
			if err := generateAndSaveSecretKey(); err != nil {
				return fmt.Errorf("重新生成密钥失败: %v", err)
			}
			log.Println("🔑 密钥文件为空，已重新生成访问密钥")
		} else {
			log.Println("🔑 已加载现有访问密钥")
		}
	}

	// 输出密钥内容
	log.Printf("🔐 访问密钥: %s", secretKey)
	return nil
}

// generateAndSaveSecretKey 生成并保存密钥
func generateAndSaveSecretKey() error {
	// 生成32字节的随机密钥
	keyBytes := make([]byte, SecretKeyLength)
	if _, err := rand.Read(keyBytes); err != nil {
		return fmt.Errorf("生成随机密钥失败: %v", err)
	}

	// 转换为十六进制字符串
	secretKey = hex.EncodeToString(keyBytes)

	// 保存到文件
	if err := os.WriteFile(SecretKeyFile, []byte(secretKey), 0600); err != nil {
		return fmt.Errorf("保存密钥文件失败: %v", err)
	}

	return nil
}

// loadSecretKey 从文件加载密钥
func loadSecretKey() error {
	content, err := os.ReadFile(SecretKeyFile)
	if err != nil {
		return fmt.Errorf("读取密钥文件失败: %v", err)
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
	log.Printf("🔄 已重新生成访问密钥: %s", secretKey)
	return nil
}

// GetSecretKeyFilePath 获取密钥文件路径
func GetSecretKeyFilePath() string {
	absPath, _ := filepath.Abs(SecretKeyFile)
	return absPath
}
