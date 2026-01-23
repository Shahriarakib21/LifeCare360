import PDFDocument from 'pdfkit';
import { Readable } from 'stream';

interface Medication {
  name: string;
  dosage: string;
  frequency: string;
  duration: string;
  instructions?: string;
}

interface PrescriptionData {
  patientName: string;
  patientAge?: string;
  patientGender?: string;
  date: string;
  doctorName: string;
  doctorSpecialization: string;
  doctorLicense?: string;
  doctorContact?: string;
  medications: Medication[];
  diagnosis?: string;
  notes?: string;
  followUpDate?: string;
}

export const generatePrescriptionPDF = async (data: PrescriptionData): Promise<Buffer> => {
  return new Promise((resolve, reject) => {
    try {
      const doc = new PDFDocument({ margin: 50, size: 'A4' });
      const buffers: Buffer[] = [];

      doc.on('data', buffers.push.bind(buffers));
      doc.on('end', () => {
        const pdfBuffer = Buffer.concat(buffers);
        resolve(pdfBuffer);
      });
      doc.on('error', reject);

      // Header
      doc
        .fontSize(20)
        .font('Helvetica-Bold')
        .text('PRESCRIPTION', { align: 'center' })
        .moveDown(0.5);

      // Doctor Information
      doc
        .fontSize(12)
        .font('Helvetica-Bold')
        .text('Doctor Information:', { continued: false })
        .font('Helvetica')
        .text(`Dr. ${data.doctorName}`, { indent: 20 })
        .text(data.doctorSpecialization, { indent: 20 });

      if (data.doctorLicense) {
        doc.text(`License: ${data.doctorLicense}`, { indent: 20 });
      }
      if (data.doctorContact) {
        doc.text(`Contact: ${data.doctorContact}`, { indent: 20 });
      }

      doc.moveDown(1);

      // Patient Information
      doc
        .fontSize(12)
        .font('Helvetica-Bold')
        .text('Patient Information:', { continued: false })
        .font('Helvetica')
        .text(`Name: ${data.patientName}`, { indent: 20 });

      if (data.patientAge) {
        doc.text(`Age: ${data.patientAge}`, { indent: 20 });
      }
      if (data.patientGender) {
        doc.text(`Gender: ${data.patientGender}`, { indent: 20 });
      }
      doc.text(`Date: ${data.date}`, { indent: 20 });

      doc.moveDown(1);

      // Diagnosis
      if (data.diagnosis) {
        doc
          .fontSize(12)
          .font('Helvetica-Bold')
          .text('Diagnosis:', { continued: false })
          .font('Helvetica')
          .text(data.diagnosis, { indent: 20 })
          .moveDown(1);
      }

      // Medications
      doc
        .fontSize(12)
        .font('Helvetica-Bold')
        .text('Medications:', { continued: false })
        .moveDown(0.5);

      data.medications.forEach((med, index) => {
        doc
          .font('Helvetica-Bold')
          .text(`${index + 1}. ${med.name}`, { indent: 20 })
          .font('Helvetica')
          .text(`   Dosage: ${med.dosage}`, { indent: 20 })
          .text(`   Frequency: ${med.frequency}`, { indent: 20 })
          .text(`   Duration: ${med.duration}`, { indent: 20 });

        if (med.instructions) {
          doc.text(`   Instructions: ${med.instructions}`, { indent: 20 });
        }
        doc.moveDown(0.5);
      });

      doc.moveDown(1);

      // Notes
      if (data.notes) {
        doc
          .fontSize(12)
          .font('Helvetica-Bold')
          .text('Additional Notes:', { continued: false })
          .font('Helvetica')
          .text(data.notes, { indent: 20 })
          .moveDown(1);
      }

      // Follow-up
      if (data.followUpDate) {
        doc
          .fontSize(12)
          .font('Helvetica-Bold')
          .text('Follow-up Date:', { continued: false })
          .font('Helvetica')
          .text(data.followUpDate, { indent: 20 })
          .moveDown(1);
      }

      // Footer
      const margin = 50;
      const pageWidth = doc.page.width;
      const contentWidth = pageWidth - (2 * margin);

      // Reset x position to left margin for footer
      doc.x = margin;

      doc
        .moveDown(2)
        .fontSize(10)
        .font('Helvetica-Oblique')
        .text('This is a computer-generated prescription. Please consult your doctor for any concerns.', {
          align: 'center',
          width: contentWidth,
        })
        .moveDown(0.8)
        .fillColor('#999999')
        .text(`Generated on: ${new Date().toLocaleString()}`, {
          align: 'center',
          width: contentWidth,
        });

      // Signature line
      doc
        .moveDown(2)
        .font('Helvetica')
        .fontSize(12)
        .fillColor('#000000')
        .text('Doctor Signature: _________________________', {
          align: 'right',
          width: contentWidth,
        });

      doc.end();
    } catch (error) {
      reject(error);
    }
  });
};

interface LabResult {
  testName: string;
  value: number;
  unit: string;
  normalRange: {
    min: number;
    max: number;
  };
  status: 'normal' | 'low' | 'high' | 'critical';
}

interface LabResultData {
  patientName: string;
  patientAge?: string;
  patientGender?: string;
  date: string;
  labName: string;
  labContact?: string;
  testResults: LabResult[];
  notes?: string;
  requestedBy?: string;
}

export const generateLabResultPDF = async (data: LabResultData): Promise<Buffer> => {
  return new Promise((resolve, reject) => {
    try {
      const doc = new PDFDocument({ margin: 50, size: 'A4' });
      const buffers: Buffer[] = [];

      doc.on('data', buffers.push.bind(buffers));
      doc.on('end', () => {
        const pdfBuffer = Buffer.concat(buffers);
        resolve(pdfBuffer);
      });
      doc.on('error', reject);

      // Header
      doc
        .fontSize(20)
        .font('Helvetica-Bold')
        .text('LABORATORY TEST RESULTS', { align: 'center' })
        .moveDown(0.5);

      // Lab Information
      doc
        .fontSize(12)
        .font('Helvetica-Bold')
        .text('Laboratory Information:', { continued: false })
        .font('Helvetica')
        .text(data.labName, { indent: 20 });

      if (data.labContact) {
        doc.text(`Contact: ${data.labContact}`, { indent: 20 });
      }

      doc.moveDown(1);

      // Patient Information
      doc
        .fontSize(12)
        .font('Helvetica-Bold')
        .text('Patient Information:', { continued: false })
        .font('Helvetica')
        .text(`Name: ${data.patientName}`, { indent: 20 });

      if (data.patientAge) {
        doc.text(`Age: ${data.patientAge}`, { indent: 20 });
      }
      if (data.patientGender) {
        doc.text(`Gender: ${data.patientGender}`, { indent: 20 });
      }
      doc.text(`Test Date: ${data.date}`, { indent: 20 });

      if (data.requestedBy) {
        doc.text(`Requested By: ${data.requestedBy}`, { indent: 20 });
      }

      doc.moveDown(1);

      // Test Results Table Header
      doc
        .fontSize(12)
        .font('Helvetica-Bold')
        .text('Test Results:', { continued: false })
        .moveDown(0.5);

      // Table
      const tableTop = doc.y;
      const tableLeft = 50;
      const colWidths = [200, 80, 80, 100, 100];
      const rowHeight = 25;

      // Header row
      doc
        .font('Helvetica-Bold')
        .fontSize(10)
        .text('Test Name', tableLeft, tableTop)
        .text('Value', tableLeft + colWidths[0], tableTop)
        .text('Unit', tableLeft + colWidths[0] + colWidths[1], tableTop)
        .text('Normal Range', tableLeft + colWidths[0] + colWidths[1] + colWidths[2], tableTop)
        .text('Status', tableLeft + colWidths[0] + colWidths[1] + colWidths[2] + colWidths[3], tableTop);

      // Data rows
      let currentY = tableTop + rowHeight;
      doc.font('Helvetica').fontSize(9);

      data.testResults.forEach((result, index) => {
        if (currentY > 700) {
          // New page if needed
          doc.addPage();
          currentY = 50;
        }

        const statusColor = result.status === 'critical' ? '#FF0000'
          : result.status === 'high' || result.status === 'low' ? '#FFA500'
            : '#000000';

        doc
          .text(result.testName || 'Unknown', tableLeft, currentY, { width: colWidths[0], ellipsis: true })
          .text(result.value.toString(), tableLeft + colWidths[0], currentY)
          .text(result.unit || '', tableLeft + colWidths[0] + colWidths[1], currentY)
          .text(`${result.normalRange.min}-${result.normalRange.max}`, tableLeft + colWidths[0] + colWidths[1] + colWidths[2], currentY)
          .fillColor(statusColor)
          .text(result.status.toUpperCase(), tableLeft + colWidths[0] + colWidths[1] + colWidths[2] + colWidths[3], currentY)
          .fillColor('#000000');

        currentY += rowHeight;
      });

      doc.y = currentY + 10;

      // Notes
      if (data.notes) {
        doc
          .moveDown(1)
          .fontSize(12)
          .font('Helvetica-Bold')
          .text('Additional Notes:', { continued: false })
          .font('Helvetica')
          .text(data.notes, { indent: 20 })
          .moveDown(1);
      }

      // Footer
      const margin = 50;
      const pageWidth = doc.page.width;
      const contentWidth = pageWidth - (2 * margin);

      // Reset x position to left margin for footer
      doc.x = margin;

      doc
        .moveDown(2)
        .fontSize(10)
        .font('Helvetica-Oblique')
        .fillColor('#666666')
        .text('This is a computer-generated lab test report. Please consult your doctor for interpretation.', {
          align: 'center',
          width: contentWidth,
        })
        .moveDown(0.8)
        .fillColor('#999999')
        .text(`Generated on: ${new Date().toLocaleString()}`, {
          align: 'center',
          width: contentWidth,
        });

      // Signature line
      doc
        .moveDown(2)
        .font('Helvetica')
        .fontSize(12)
        .fillColor('#000000')
        .text('Lab Technician Signature: _________________________', {
          align: 'right',
          width: contentWidth,
        });

      doc.end();
    } catch (error) {
      reject(error);
    }
  });
};

