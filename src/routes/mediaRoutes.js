const express = require('express');
const router = express.Router();
const { archiveMediaToGitHub, archiveMultipleMedia } = require('../services/githubMediaService');
const logger = require('../utils/logger');

/**
 * POST /api/v1/media/upload
 * رفع ملف واحد وأرشفته على GitHub
 */
router.post('/upload', async (req, res) => {
  try {
    const { fileName, base64Data, type, folder = 'images' } = req.body;

    // التحقق من البيانات
    if (!base64Data || !fileName) {
      logger.warn('⚠️ محاولة رفع ملف بدون بيانات كاملة');
      return res.status(400).json({
        status: 'error',
        message: 'البيانات غير مكتملة. تأكد من وجود fileName و base64Data',
        code: 'INCOMPLETE_DATA'
      });
    }

    // تحديد نوع المجلد تلقائياً بناءً على نوع الملف
    let targetFolder = folder;
    if (type) {
      if (type.startsWith('video')) targetFolder = 'videos';
      else if (type.startsWith('image')) targetFolder = 'images';
      else if (type.startsWith('application/pdf')) targetFolder = 'documents';
    }

    logger.info(`📄 بدء رفع الملف: ${fileName} (${type || 'unknown'})`);

    const result = await archiveMediaToGitHub(fileName, base64Data, targetFolder);

    if (result.success) {
      logger.success(`✅ تم رفع الملف بنجاح: ${fileName}`);
      return res.status(200).json({
        status: 'success',
        message: 'تم رفع الملف وأرشفته بنجاح',
        data: {
          mediaUrl: result.mediaUrl,
          githubUrl: result.githubUrl,
          fileName: result.fileName,
          path: result.path,
          timestamp: result.timestamp
        }
      });
    } else {
      logger.error(`❌ فشل رفع الملف: ${result.error}`);
      return res.status(500).json({
        status: 'error',
        message: 'فشل في أرشفة الملف على GitHub',
        details: result.error,
        code: result.details
      });
    }
  } catch (error) {
    logger.error(`❌ خطأ في مسار الرفع: ${error.message}`);
    res.status(500).json({
      status: 'error',
      message: 'حدث خطأ أثناء رفع الملف',
      error: process.env.NODE_ENV === 'development' ? error.message : undefined
    });
  }
});

/**
 * POST /api/v1/media/batch-upload
 * رفع عدة ملفات دفعة واحدة
 */
router.post('/batch-upload', async (req, res) => {
  try {
    const { files } = req.body;

    if (!Array.isArray(files) || files.length === 0) {
      return res.status(400).json({
        status: 'error',
        message: 'يجب توفير مصفوفة من الملفات',
        code: 'INVALID_FILES_ARRAY'
      });
    }

    logger.info(`📦 بدء رفع ${files.length} ملف...`);

    const result = await archiveMultipleMedia(files);

    return res.status(200).json({
      status: result.failureCount === 0 ? 'success' : 'partial',
      message: `تم رفع ${result.successCount} من ${result.total} ملف`,
      data: {
        successful: result.successful,
        failed: result.failed,
        summary: {
          total: result.total,
          successCount: result.successCount,
          failureCount: result.failureCount
        }
      }
    });
  } catch (error) {
    logger.error(`❌ خطأ في الرفع الجماعي: ${error.message}`);
    res.status(500).json({
      status: 'error',
      message: 'حدث خطأ أثناء رفع الملفات',
      error: process.env.NODE_ENV === 'development' ? error.message : undefined
    });
  }
});

module.exports = router;