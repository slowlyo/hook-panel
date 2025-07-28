package i18n

import (
	"fmt"
	"strings"

	"github.com/gin-gonic/gin"
)

// Translator 翻译器结构体
type Translator struct {
	language string
	messages map[string]map[string]interface{}
}

// 全局翻译器实例
var globalTranslator *Translator

// 支持的语言列表
var supportedLanguages = []string{"zh-CN", "en-US"}

// 默认语言
const defaultLanguage = "zh-CN"

// Init 初始化多语言系统
func Init() {
	globalTranslator = &Translator{
		language: defaultLanguage,
		messages: make(map[string]map[string]interface{}),
	}

	// 加载语言包
	loadLanguagePacks()
}

// loadLanguagePacks 加载所有语言包
func loadLanguagePacks() {
	// 加载中文语言包
	globalTranslator.messages["zh-CN"] = getChineseMessages()

	// 加载英文语言包
	globalTranslator.messages["en-US"] = getEnglishMessages()
}

// GetTranslator 从上下文获取翻译器
func GetTranslator(c *gin.Context) *Translator {
	if lang, exists := c.Get("language"); exists {
		return &Translator{
			language: lang.(string),
			messages: globalTranslator.messages,
		}
	}
	return globalTranslator
}

// T 翻译函数
func (t *Translator) T(key string, params ...interface{}) string {
	// 获取当前语言的消息
	langMessages, exists := t.messages[t.language]
	if !exists {
		// 如果当前语言不存在，使用默认语言
		langMessages = t.messages[defaultLanguage]
	}

	// 解析嵌套的key（如 "error.config.not_found"）
	message := t.getNestedValue(langMessages, key)
	if message == "" {
		// 如果找不到翻译，尝试使用默认语言
		if t.language != defaultLanguage {
			defaultMessages := t.messages[defaultLanguage]
			message = t.getNestedValue(defaultMessages, key)
		}

		// 如果还是找不到，返回key本身
		if message == "" {
			message = key
		}
	}

	// 参数替换
	if len(params) > 0 {
		message = t.replaceParams(message, params...)
	}

	return message
}

// getNestedValue 获取嵌套的值
func (t *Translator) getNestedValue(messages map[string]interface{}, key string) string {
	keys := strings.Split(key, ".")
	current := messages

	for i, k := range keys {
		if i == len(keys)-1 {
			// 最后一个key，应该是字符串
			if val, ok := current[k].(string); ok {
				return val
			}
			return ""
		} else {
			// 中间的key，应该是map
			if val, ok := current[k].(map[string]interface{}); ok {
				current = val
			} else {
				return ""
			}
		}
	}

	return ""
}

// replaceParams 替换参数
func (t *Translator) replaceParams(message string, params ...interface{}) string {
	for i, param := range params {
		placeholder := fmt.Sprintf("{{%d}}", i)
		message = strings.ReplaceAll(message, placeholder, fmt.Sprintf("%v", param))
	}
	return message
}

// GetLanguage 获取当前语言
func (t *Translator) GetLanguage() string {
	return t.language
}

// IsSupported 检查语言是否支持
func IsSupported(lang string) bool {
	for _, supported := range supportedLanguages {
		if supported == lang {
			return true
		}
	}
	return false
}

// 便捷函数：从上下文获取翻译
func T(c *gin.Context, key string, params ...interface{}) string {
	translator := GetTranslator(c)
	return translator.T(key, params...)
}
