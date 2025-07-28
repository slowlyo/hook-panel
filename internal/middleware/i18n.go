package middleware

import (
	"strings"
	"sync"

	"hook-panel/internal/models"
	"hook-panel/internal/pkg/database"
	"hook-panel/internal/pkg/i18n"

	"github.com/gin-gonic/gin"
	"gorm.io/gorm"
)

// 配置缓存结构
type configCache struct {
	language string
	loaded   bool // 是否已加载
	mutex    sync.RWMutex
}

var (
	cache = &configCache{}
	// 全局缓存刷新函数，供其他包调用
	RefreshLanguageCacheFunc func()
)

// init 初始化函数
func init() {
	// 设置全局缓存刷新函数
	RefreshLanguageCacheFunc = RefreshLanguageCache
}

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
	userLang := getUserConfigLanguage()
	if userLang != "" && i18n.IsSupported(userLang) {
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

// getUserConfigLanguage 从用户配置中获取语言设置（带缓存）
func getUserConfigLanguage() string {
	cache.mutex.RLock()
	// 检查缓存是否已加载
	if cache.loaded {
		lang := cache.language
		cache.mutex.RUnlock()
		return lang
	}
	cache.mutex.RUnlock()

	// 缓存未加载，从数据库获取
	cache.mutex.Lock()
	defer cache.mutex.Unlock()

	// 双重检查，防止并发时重复查询
	if cache.loaded {
		return cache.language
	}

	// 直接查询数据库，避免循环依赖
	db := database.GetDB()
	var config models.SystemConfig
	if err := db.Where("key = ?", "system.language").First(&config).Error; err != nil {
		if err == gorm.ErrRecordNotFound {
			// 配置不存在，使用默认值
			cache.language = ""
			cache.loaded = true
			return ""
		}
		// 查询出错，返回空字符串
		return ""
	}

	// 更新缓存
	cache.language = config.Value
	cache.loaded = true
	return config.Value
}

// RefreshLanguageCache 刷新语言配置缓存（供外部调用）
func RefreshLanguageCache() {
	cache.mutex.Lock()
	defer cache.mutex.Unlock()

	// 重置加载状态，强制下次查询时重新从数据库获取
	cache.loaded = false
	cache.language = ""
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
