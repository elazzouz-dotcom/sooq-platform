const { Octokit } = require('@octokit/rest');
const fs = require('fs');
const path = require('path');
const logger = require('../utils/logger');

/**
 * خدمة أرشفة الوسائط على GitHub
 * توفر تخزين مجاني للصور والفيديوهات عبر GitHub Raw CDN
 */

const octokit = new Octokit({ auth: process.env.GITHUB_TOKEN });
const REPO_OWNER = process.env.GITHUB_OWNER || 'elazzouz-dotcom';
const REPO_NAME = process.env.GITHUB_REPO || 'sooq-platform';

/**
 * رفع وأرشفة الصور والفيديوهات في مستودع GitHub
 * @param {string} fileName - اسم الملف
 * @param {string} base64Content - ترميز Base64 للملف
 * @param {string} folder - المجلد المخصص (images / videos / documents)
 * @returns {Promise<Object>} نتيجة العملية مع الرابط المباشر
 */
async function archiveMediaToGitHub(fileName, base64Content, folder = 'images') {
  const timestamp = Date.now();
  const sanitizedFileName = fileName.replace(/[^a-zA-Z0-9._-]/g, '_');
  const filePath = `assets/uploads/${folder}/${timestamp}_${sanitizedFileName}`;

  try {
    logger.info(`📄 جاري رفع الملف: ${fileName} إلى GitHub...`);

    const response = await octokit.repos.createOrUpdateFileContents({
      owner: REPO_OWNER,
      repo: REPO_NAME,
      path: filePath,
      message: `chore(media): archive media file [${fileName}] from SOOQ platform`,
      content: base64Content,
      branch: 'main',
      committer: {
        name: 'SOOQ Media Archiver',
        email: 'sooq@platform.dev'
      }
    });

    // بناء الرابط المباشر من GitHub Raw CDN
    const rawUrl = `https://raw.githubusercontent.com/${REPO_OWNER}/${REPO_NAME}/main/${filePath}`;
    const githubUrl = `https://github.com/${REPO_OWNER}/${REPO_NAME}/blob/main/${filePath}`;

    logger.success(`✅ تم أرشفة الملف بنجاح: ${fileName}`);

    return {
      success: true,
      mediaUrl: rawUrl,
      githubUrl: githubUrl,
      path: filePath,
      fileName: sanitizedFileName,
      timestamp: timestamp,
      sha: response.data.commit.sha
    };
  } catch (error) {
    logger.error(`❌ فشل في أرشفة الملف على GitHub: ${error.message}`);
    return {
      success: false,
      error: error.message,
      details: error.status || 'UNKNOWN_ERROR'
    };
  }
}

/**
 * رفع عدة ملفات دفعة واحدة
 * @param {Array} files - مصفوفة من الملفات
 * @returns {Promise<Array>} نتائج الرفع
 */
async function archiveMultipleMedia(files) {
  logger.info(`📦 جاري رفع ${files.length} ملف...`);

  const results = await Promise.allSettled(
    files.map(file =>
      archiveMediaToGitHub(file.name, file.base64Content, file.folder || 'images')
    )
  );

  const successful = results.filter(r => r.status === 'fulfilled' && r.value.success);
  const failed = results.filter(r => r.status === 'rejected' || !r.value.success);

  logger.info(`📊 نتائج الرفع: ${successful.length} نجح، ${failed.length} فشل`);

  return {
    successful: successful.map(r => r.value),
    failed: failed.map(r => r.value || r.reason),
    total: files.length,
    successCount: successful.length,
    failureCount: failed.length
  };
}

module.exports = {
  archiveMediaToGitHub,
  archiveMultipleMedia
};