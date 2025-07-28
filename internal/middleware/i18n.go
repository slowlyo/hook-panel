package middleware

import (
	"strings"

	"hook-panel/internal/handlers"
	"hook-panel/internal/pkg/i18n"

	"github.com/gin-gonic/gin"
)

// I18nMiddleware 多语言中间件
func I18nMiddleware() gin.HandlerFunc {
	return func(c *gin.Context) {
		lang := detectLanguage(c)
		c.Set("language", lang)
		c.Next()
	}
}

// detectLanguage 检测用户语言偏好
func detectLanguage(c *gin.Context) string {
	// 1. 优先从用户配置中获取语言设置
	if userLang := getUserConfigLanguage(); userLang != "" && i18n.IsSupported(userLang) {
		return userLang
	}
	
	// 2. 从 Accept-Language 请求头获取
	acceptLang := c.GetHeader("Accept-Language")
	if acceptLang != "" {
		// 解析 Accept-Language 头
		langs := parseAcceptLanguage(acceptLang)
		for _, lang := range langs {
			if i18n.IsSupported(lang) {
				return lang
			}
		}
	}
	
	// 3. 使用默认语言
	return "zh-CN"
}

// getUserConfigLanguage 从用户配置中获取语言设置
func getUserConfigLanguage() string {
	// 从数据库配置中获取用户设置的语言
	lang, err := handlers.GetConfigValue("system.language")
	if err != nil {
		return ""
	}
	return lang
}

// parseAcceptLanguage 解析 Accept-Language 头
func parseAcceptLanguage(acceptLang string) []string {
	var languages []string
	
	// 简单解析 Accept-Language 头
	// 例如: "zh-CN,zh;q=0.9,en;q=0.8"
	parts := strings.Split(acceptLang, ",")
	for _, part := range parts {
		// 移除权重信息
		lang := strings.Split(strings.TrimSpace(part), ";")[0]
		
		// 标准化语言代码
		lang = normalizeLanguageCode(lang)
		if lang != "" {
			languages = append(languages, lang)
		}
	}
	
	return languages
}

// normalizeLanguageCode 标准化语言代码
func normalizeLanguageCode(lang string) string {
	lang = strings.ToLower(lang)
	
	// 映射常见的语言代码到我们支持的格式
	switch {
	case strings.HasPrefix(lang, "zh-cn") || strings.HasPrefix(lang, "zh_cn") || lang == "zh":
		return "zh-CN"
	case strings.HasPrefix(lang, "en-us") || strings.HasPrefix(lang, "en_us") || lang == "en":
		return "en-US"
	default:
		return ""
	}
}
