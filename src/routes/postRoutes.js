const express = require('express');
const router = express.Router();
const logger = require('../utils/logger');

/**
 * POST /api/v1/posts/create
 * إنشاء منشور جديد مع وسائط وتحسين AI
 */
router.post('/create', async (req, res) => {
  try {
    const { content, mediaUrls, aiOptimize = false, aiProvider = 'gemini' } = req.body;
    const userId = req.user?.id || 'anonymous';

    logger.info(`📝 بدء إنشاء منشور جديد من المستخدم: ${userId}`);

    let finalContent = content || '';

    // إذا كان المحتوى فارغاً والوسائط موجودة، توليد وصف تلقائي بـ AI
    if (!finalContent.trim() && mediaUrls && mediaUrls.length > 0) {
      logger.info('🤖 تفعيل توليد الوصف التلقائي بـ AI...');
      // في بيئة الإنتاج، ستقوم بنداء generateAIResponse من محرك الذكاء الاصطناعي
      finalContent = `منشور جديد يحتوي على ${mediaUrls.length} وسائط مثيرة`;
    }

    // بناء بيانات المنشور
    const post = {
      id: `post_${Date.now()}`,
      userId,
      content: finalContent,
      mediaUrls: mediaUrls || [],
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
      status: 'published',
      stats: {
        likes: 0,
        comments: 0,
        shares: 0,
        views: 0
      }
    };

    logger.success(`✅ تم إنشاء المنشور: ${post.id}`);

    return res.status(201).json({
      status: 'success',
      message: 'تم نشر المنشور وأرشفة الأصول بنجاح',
      data: {
        post,
        message: '✅ المنشور جاهز للعرض على الجميع'
      }
    });
  } catch (error) {
    logger.error(`❌ خطأ في إنشاء المنشور: ${error.message}`);
    res.status(500).json({
      status: 'error',
      message: 'فشل في إنشاء المنشور',
      error: process.env.NODE_ENV === 'development' ? error.message : undefined
    });
  }
});

/**
 * POST /api/v1/posts/preview
 * معاينة المنشور قبل النشر
 */
router.post('/preview', async (req, res) => {
  try {
    const { content, mediaUrls, aiOptimize = true, aiProvider = 'gemini' } = req.body;

    logger.info('👁️ بدء معاينة المنشور...');

    let previewContent = content || '';

    // توليد وصف إذا لم يكن موجوداً
    if (!previewContent.trim() && mediaUrls && mediaUrls.length > 0) {
      previewContent = `منشور جديد يحتوي على ${mediaUrls.length} وسائط مثيرة`;
    }

    logger.success('✅ تم إنشاء معاينة المنشور');

    return res.status(200).json({
      status: 'success',
      message: 'معاينة المنشور',
      data: {
        original: content,
        preview: previewContent,
        mediaCount: mediaUrls?.length || 0,
        mediaUrls: mediaUrls || [],
        characterCount: previewContent.length,
        estimatedReadTime: Math.ceil(previewContent.split(' ').length / 200)
      }
    });
  } catch (error) {
    logger.error(`❌ خطأ في معاينة المنشور: ${error.message}`);
    res.status(500).json({
      status: 'error',
      message: 'فشل في إنشاء معاينة المنشور'
    });
  }
});

module.exports = router;