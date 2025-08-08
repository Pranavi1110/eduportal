const PDFDocument = require('pdfkit');
const fs = require('fs');
const path = require('path');

class CertificateGenerator {
  constructor() {
    this.certificatesDir = path.join(__dirname, '../certificates');
    this.ensureCertificatesDirectory();
  }

  ensureCertificatesDirectory() {
    if (!fs.existsSync(this.certificatesDir)) {
      fs.mkdirSync(this.certificatesDir, { recursive: true });
    }
  }

  async generateCertificate(certificateData) {
    const {
      studentName,
      taskTitle,
      startupName,
      completionDate,
      certificateNumber,
      skills
    } = certificateData;

    const doc = new PDFDocument({
      size: 'A4',
      layout: 'landscape',
      margins: {
        top: 50,
        bottom: 50,
        left: 50,
        right: 50
      }
    });

    const filename = `certificate_${certificateNumber}.pdf`;
    const filepath = path.join(this.certificatesDir, filename);
    const stream = fs.createWriteStream(filepath);

    doc.pipe(stream);

    // Add gradient background
    const gradient = doc.linearGradient(0, 0, doc.page.width, doc.page.height);
    gradient.stop(0, '#f8fafc');
    gradient.stop(1, '#e2e8f0');
    doc.rect(0, 0, doc.page.width, doc.page.height).fill(gradient);

    // Add decorative border
    doc.rect(20, 20, doc.page.width - 40, doc.page.height - 40)
       .lineWidth(4)
       .stroke('#1e40af');

    // Add inner border with pattern
    doc.rect(30, 30, doc.page.width - 60, doc.page.height - 60)
       .lineWidth(2)
       .stroke('#3b82f6');

    // Add decorative corners
    const cornerSize = 25;
    const positions = [
      [30, 30], [doc.page.width - 55, 30],
      [30, doc.page.height - 55], [doc.page.width - 55, doc.page.height - 55]
    ];

    positions.forEach(([x, y]) => {
      doc.moveTo(x, y)
         .lineTo(x + cornerSize, y)
         .lineTo(x, y + cornerSize)
         .stroke('#1e40af');
    });

    // Add logo and branding (left side)
    doc.fontSize(28)
       .fill('#1e40af')
       .text('HUBINITY', 80, 80);

    doc.fontSize(14)
       .fill('#64748b')
       .text('Innovation Hub', 80, 115);

    // Add decorative line under logo
    doc.moveTo(80, 130)
       .lineTo(200, 130)
       .lineWidth(2)
       .stroke('#1e40af');

    // Certificate title with decorative elements
    doc.fontSize(42)
       .fill('#1e293b')
       .text('Certificate of Completion', 0, 160, {
         align: 'center'
       });

    // Add decorative lines around title
    doc.moveTo(doc.page.width * 0.2, 200)
       .lineTo(doc.page.width * 0.4, 200)
       .lineWidth(1)
       .stroke('#3b82f6');

    doc.moveTo(doc.page.width * 0.6, 200)
       .lineTo(doc.page.width * 0.8, 200)
       .lineWidth(1)
       .stroke('#3b82f6');

    // Main content
    doc.fontSize(18)
       .fill('#374151')
       .text('This is to certify that', 0, 240, {
         align: 'center'
       });

    // Student name with emphasis
    doc.fontSize(28)
       .fill('#1e40af')
       .text(studentName, 0, 270, {
         align: 'center'
       });

    // Project details
    doc.fontSize(18)
       .fill('#374151')
       .text('has successfully completed the project', 0, 310, {
         align: 'center'
       });

    // Task title with quotes
    doc.fontSize(24)
       .fill('#1e40af')
       .text(`"${taskTitle}"`, 0, 340, {
         align: 'center'
       });

    // Startup name
    doc.fontSize(16)
       .fill('#64748b')
       .text(`for ${startupName}`, 0, 370, {
         align: 'center'
       });

    // Skills section with better formatting
    if (skills && skills.length > 0) {
      doc.fontSize(14)
         .fill('#6b7280')
         .text(`Skills demonstrated: ${skills.join(', ')}`, 0, 400, {
           align: 'center'
         });
    }

    // Completion date
    doc.fontSize(14)
       .fill('#6b7280')
       .text(`Completed on: ${new Date(completionDate).toLocaleDateString('en-US', {
         year: 'numeric',
         month: 'long',
         day: 'numeric'
       })}`, 0, 430, {
         align: 'center'
       });

    // Certificate number
    doc.fontSize(12)
       .fill('#9ca3af')
       .text(`Certificate #: ${certificateNumber}`, 0, 460, {
         align: 'center'
       });

    // Signature section (right side) with better styling
    doc.fontSize(16)
       .fill('#374151')
       .text('Signature', doc.page.width - 220, 480);

    doc.moveTo(doc.page.width - 220, 500)
       .lineTo(doc.page.width - 120, 500)
       .lineWidth(2)
       .stroke('#374151');

    // Date (right side)
    doc.fontSize(14)
       .fill('#6b7280')
       .text(`Date: ${new Date().toLocaleDateString('en-US', {
         year: 'numeric',
         month: 'long',
         day: 'numeric'
       })}`, doc.page.width - 220, 520);

    // Footer with enhanced styling
    doc.fontSize(12)
       .fill('#9ca3af')
       .text('This certificate is issued by Hubinity Innovation Hub', 0, doc.page.height - 80, {
         align: 'center'
       });

    // Add QR code placeholder (for future enhancement)
    doc.fontSize(10)
       .fill('#d1d5db')
       .text('QR Code', doc.page.width - 100, doc.page.height - 120, {
         align: 'center'
       });

    doc.end();

    return new Promise((resolve, reject) => {
      stream.on('finish', () => {
        resolve({
          filepath,
          filename,
          certificateNumber
        });
      });
      stream.on('error', reject);
    });
  }

  async deleteCertificate(filename) {
    const filepath = path.join(this.certificatesDir, filename);
    if (fs.existsSync(filepath)) {
      fs.unlinkSync(filepath);
    }
  }
}

module.exports = new CertificateGenerator(); 