import { useEffect, useMemo, useState } from "react";
import { useForm } from "react-hook-form";
import { z } from "zod";
import { zodResolver } from "@hookform/resolvers/zod";
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from "@/components/ui/form";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle } from "@/components/ui/alert-dialog";
import { toast } from "sonner";
import Header from "@/components/site/Header";
import { PDFDocument, rgb, StandardFonts } from "pdf-lib";
import logoUrl from "@/assets/ssm-logo.png";
import { Loader2, CheckCircle2, CreditCard } from "lucide-react";

// Schema Validation
const schema = z.object({
  fullName: z.string().min(3, "Full name is required"),
  guardianName: z.string().min(3, "Parent/Guardian name is required"),
  dob: z.string().min(1, "Date of birth is required"),
  phone: z
    .string()
    .min(10, "Enter a valid contact number")
    .regex(/^\d{10}$/g, "Contact number must be 10 digits"),
  email: z.string().email(),
  street: z.string().min(3),
  city: z.string().min(2),
  district: z.string().min(2),
  state: z.string().min(2),
  pincode: z
    .string()
    .regex(/^\d{6}$/g, "Pincode must be 6 digits"),
  tenthMarks: z.string().min(1, "Required"),
  tenthBoard: z.string().min(2, "Required"),
  twelfthMarks: z.string().min(1, "Required"),
  twelfthBoard: z.string().min(2, "Required"),
  physicsMarks: z.coerce.number().min(0, "Physics marks required").max(100, "Maximum 100 marks"),
  chemistryMarks: z.coerce.number().min(0, "Chemistry marks required").max(100, "Maximum 100 marks"),
  mathsMarks: z.coerce.number().min(0, "Mathematics marks required").max(100, "Maximum 100 marks"),
  course: z.string().min(1, "Select a course"),
  aadharNumber: z.string().regex(/^\d{12}$/g, "Aadhaar must be 12 digits"),
  firstGraduate: z.enum(["yes", "no"]),
});

export type AdmissionFormValues = z.infer<typeof schema>;

const courses = [
  "B.E. Computer Science and Engineering",
  "B.E. Computer Science and Engineering (Cyber Security)",
  "B.E. Computer Science and Engineering (AI & ML)",
  "B.Tech. Artificial Intelligence and Data Science (AI&DS)",
  "B.Tech. Computer Science and Business Systems (CSBS)",
  "B.E. Electronics and Communication Engineering",
  "B.E. Electrical and Electronics Engineering",
  "B.E. Mechanical Engineering",
  "B.E. Civil Engineering",
  "M.E. Communication Systems",
  "M.E. Thermal Engineering",
];

// Helper Functions
async function urlToArrayBuffer(url: string) {
  const res = await fetch(url);
  return await res.arrayBuffer();
}

async function fileToArrayBuffer(file: File) {
  return await file.arrayBuffer();
}

interface CertificateFiles {
  aadharFile?: File;
  communityCertFile?: File;
  nativityCertFile?: File;
  birthCertFile?: File;
  schoolTcDcFile?: File;
  incomeCertFile?: File;
  firstGradProofFile?: File;
  tenthMarksheetFile?: File;
  twelfthMarksheetFile?: File;
}

// PDF Generation Logic
async function generatePdf(
  values: AdmissionFormValues, 
  photoFile?: File,
  certificates?: CertificateFiles
) {
  const pdfDoc = await PDFDocument.create();
  const font = await pdfDoc.embedFont(StandardFonts.Helvetica);
  const boldFont = await pdfDoc.embedFont(StandardFonts.HelveticaBold);

  // A4 dimensions
  const pageWidth = 595.28;
  const pageHeight = 841.89;
  
  // Colors
  const primaryColor = rgb(0.13, 0.20, 0.33);
  const accentColor = rgb(0.85, 0.47, 0.04);
  const lightGray = rgb(0.96, 0.97, 0.98);
  const darkGray = rgb(0.3, 0.3, 0.3);
  const successGreen = rgb(0.09, 0.64, 0.29);
  const borderGray = rgb(0.8, 0.8, 0.8);
  const white = rgb(1, 1, 1);

  // Margins
  const marginLeft = 40;
  const marginRight = 40;
  const marginTop = 40;
  const marginBottom = 60;
  const contentWidth = pageWidth - marginLeft - marginRight;

  // Generate unique application ID
  const appId = `SSM${new Date().getFullYear()}${Date.now().toString().slice(-6)}`;
  const issueDate = new Date().toLocaleDateString("en-IN", { day: "2-digit", month: "short", year: "numeric" });
  const academicYear = `${new Date().getFullYear()}-${new Date().getFullYear() + 1}`;

  // Track all pages for page numbering
  const allPages: ReturnType<typeof pdfDoc.addPage>[] = [];

  // Helper function to add page header
  async function addPageHeader(page: ReturnType<typeof pdfDoc.addPage>, title: string) {
    const { width, height } = page.getSize();
    
    // Header background
    page.drawRectangle({ x: 0, y: height - 80, width, height: 80, color: primaryColor });
    page.drawRectangle({ x: 0, y: height - 84, width, height: 4, color: accentColor });

    // Logo box with white background
    const logoBoxX = marginLeft;
    const logoBoxY = height - 72;
    const logoBoxWidth = 70;
    const logoBoxHeight = 55;
    page.drawRectangle({ x: logoBoxX, y: logoBoxY, width: logoBoxWidth, height: logoBoxHeight, color: white });

    // Logo (fit inside box)
    try {
      const logoBytes = await urlToArrayBuffer(logoUrl);
      const logoImage = await pdfDoc.embedPng(logoBytes);

      const padding = 6;
      const maxW = logoBoxWidth - padding * 2;
      const maxH = logoBoxHeight - padding * 2;

      const scale = Math.min(maxW / logoImage.width, maxH / logoImage.height);
      const drawW = logoImage.width * scale;
      const drawH = logoImage.height * scale;

      page.drawImage(logoImage, {
        x: logoBoxX + (logoBoxWidth - drawW) / 2,
        y: logoBoxY + (logoBoxHeight - drawH) / 2,
        width: drawW,
        height: drawH,
      });
    } catch (err) {
      console.error("Logo embedding failed:", err);
    }

    // Text content area starts after logo box
    const textStartX = logoBoxX + logoBoxWidth + 15;
    const badgeWidth = 140;
    const textEndX = width - badgeWidth - marginRight - 20;
    
    // Institution name - positioned properly after logo
    page.drawText("SSM INSTITUTE OF", {
      x: textStartX, y: height - 28, size: 11, font: boldFont, color: white
    });
    page.drawText("ENGINEERING AND TECHNOLOGY", {
      x: textStartX, y: height - 42, size: 11, font: boldFont, color: white
    });
    page.drawText("AN AUTONOMOUS INSTITUTION", {
      x: textStartX, y: height - 55, size: 8, font, color: rgb(0.9, 0.9, 0.9)
    });

    // Document title
    page.drawText(title, {
      x: textStartX, y: height - 70, size: 10, font: boldFont, color: accentColor
    });

    // Application ID badge - right aligned
    const badgeX = width - badgeWidth - marginRight;
    const badgeY = height - 68;
    const badgeHeight = 45;
    page.drawRectangle({ x: badgeX, y: badgeY, width: badgeWidth, height: badgeHeight, color: accentColor });
    page.drawText("Application ID", { x: badgeX + 10, y: badgeY + badgeHeight - 15, size: 8, font, color: white });
    page.drawText(appId, { x: badgeX + 10, y: badgeY + badgeHeight - 32, size: 11, font: boldFont, color: white });

    return height - 100;
  }

  // Helper function to add page footer with page number
  function addPageFooter(page: ReturnType<typeof pdfDoc.addPage>, pageNum: number, totalPages: number) {
    const { width } = page.getSize();
    
    page.drawRectangle({ x: 0, y: 0, width, height: marginBottom - 10, color: lightGray });
    page.drawLine({ start: { x: 0, y: marginBottom - 10 }, end: { x: width, y: marginBottom - 10 }, thickness: 1, color: borderGray });
    
    page.drawText(`Issue Date: ${issueDate}`, { x: marginLeft, y: 30, size: 8, font, color: darkGray });
    page.drawText(`App ID: ${appId}`, { x: marginLeft, y: 18, size: 8, font: boldFont, color: primaryColor });
    page.drawText(`Page ${pageNum} of ${totalPages}`, { x: width - 80, y: 24, size: 9, font, color: darkGray });
    page.drawText("ssmietadmissionportal@gmail.com", { x: width / 2 - 60, y: 18, size: 7, font, color: darkGray });
  }

  // Helper to wrap text
  function wrapText(text: string, maxWidth: number, fontSize: number): string[] {
    const words = text.split(" ");
    const lines: string[] = [];
    let currentLine = "";

    words.forEach((word) => {
      const testLine = currentLine ? `${currentLine} ${word}` : word;
      const textWidth = font.widthOfTextAtSize(testLine, fontSize);
      if (textWidth > maxWidth) {
        if (currentLine) lines.push(currentLine);
        currentLine = word;
      } else {
        currentLine = testLine;
      }
    });
    if (currentLine) lines.push(currentLine);
    return lines;
  }

  // ========== PAGE 1: APPLICATION FORM ==========
  const page1 = pdfDoc.addPage([pageWidth, pageHeight]);
  allPages.push(page1);
  let currentY = await addPageHeader(page1, "ADMISSION APPLICATION FORM");

  // Academic Year & Issue Date row
  page1.drawRectangle({ x: marginLeft, y: currentY - 18, width: contentWidth, height: 18, color: rgb(0.98, 0.96, 0.92) });
  page1.drawText(`Academic Year: ${academicYear}`, { x: marginLeft + 10, y: currentY - 13, size: 8, font: boldFont, color: primaryColor });
  page1.drawText(`Issue Date: ${issueDate}`, { x: pageWidth - marginRight - 100, y: currentY - 13, size: 8, font, color: darkGray });
  currentY -= 25;

  // Photo box on right side
  const photoBoxWidth = 75;
  const photoBoxHeight = 90;
  const photoBoxX = pageWidth - marginRight - photoBoxWidth;
  const photoBoxY = currentY - photoBoxHeight;

  page1.drawRectangle({ x: photoBoxX, y: photoBoxY, width: photoBoxWidth, height: photoBoxHeight, borderColor: primaryColor, borderWidth: 1.5, color: rgb(0.99, 0.99, 0.99) });

  if (photoFile) {
    try {
      const photoBytes = await fileToArrayBuffer(photoFile);
      const photoImage = photoFile.type === "image/png" 
        ? await pdfDoc.embedPng(photoBytes) 
        : await pdfDoc.embedJpg(photoBytes);
      
      const scale = Math.min((photoBoxWidth - 4) / photoImage.width, (photoBoxHeight - 4) / photoImage.height);
      const scaledWidth = photoImage.width * scale;
      const scaledHeight = photoImage.height * scale;
      
      page1.drawImage(photoImage, {
        x: photoBoxX + (photoBoxWidth - scaledWidth) / 2,
        y: photoBoxY + (photoBoxHeight - scaledHeight) / 2,
        width: scaledWidth, height: scaledHeight
      });
    } catch (err) {
      console.error("Photo embedding error:", err);
    }
  }
  page1.drawText("Photograph", { x: photoBoxX + 15, y: photoBoxY - 12, size: 7, font, color: darkGray });

  const rightColumnX = photoBoxX - 15;

  // Section drawing helpers
  let sectionNum = 0;
  function drawSection(title: string) {
    sectionNum++;
    page1.drawRectangle({ x: marginLeft, y: currentY - 16, width: rightColumnX - marginLeft, height: 16, color: primaryColor });
    page1.drawText(`${sectionNum}. ${title}`, { x: marginLeft + 6, y: currentY - 12, size: 8, font: boldFont, color: white });
    currentY -= 20;
  }

  function drawRow(label: string, value: string, bgColor = white) {
    const rowHeight = 14;
    page1.drawRectangle({ x: marginLeft, y: currentY - rowHeight, width: rightColumnX - marginLeft, height: rowHeight, color: bgColor, borderColor: borderGray, borderWidth: 0.3 });
    page1.drawText(label, { x: marginLeft + 4, y: currentY - 10, size: 7, font: boldFont, color: darkGray });
    
    const valueX = marginLeft + 110;
    const maxWidth = rightColumnX - valueX - 5;
    const lines = wrapText(value, maxWidth, 7);
    lines.forEach((line, i) => {
      page1.drawText(line, { x: valueX, y: currentY - 10 - (i * 9), size: 7, font, color: rgb(0, 0, 0) });
    });
    currentY -= Math.max(rowHeight, lines.length * 9 + 5);
  }

  // Section 1: Personal Information
  drawSection("PERSONAL INFORMATION");
  drawRow("Full Name", values.fullName, lightGray);
  drawRow("Parent/Guardian", values.guardianName);
  drawRow("Date of Birth", values.dob, lightGray);
  drawRow("Aadhaar Number", values.aadharNumber);
  currentY -= 5;

  // Section 2: Contact Details
  drawSection("CONTACT DETAILS");
  drawRow("Mobile", values.phone, lightGray);
  drawRow("Email", values.email);
  const fullAddress = `${values.street}, ${values.city}, ${values.district}, ${values.state} - ${values.pincode}`;
  drawRow("Address", fullAddress, lightGray);
  currentY -= 5;

  // Section 3: Academic Details
  drawSection("ACADEMIC DETAILS");
  drawRow("10th Marks", `${values.tenthMarks} (${values.tenthBoard})`, lightGray);
  drawRow("12th Marks", `${values.twelfthMarks} (${values.twelfthBoard})`);
  currentY -= 5;

  // Subject Marks Table
  page1.drawText("12th Subject-wise Marks:", { x: marginLeft + 4, y: currentY - 5, size: 7, font: boldFont, color: darkGray });
  currentY -= 12;

  const subjects = [
    { name: "Physics", mark: values.physicsMarks },
    { name: "Chemistry", mark: values.chemistryMarks },
    { name: "Mathematics", mark: values.mathsMarks }
  ];
  const colWidth = (rightColumnX - marginLeft - 10) / 3;

  subjects.forEach((subj, i) => {
    const x = marginLeft + 5 + (i * colWidth);
    page1.drawRectangle({ x, y: currentY - 14, width: colWidth - 3, height: 14, color: primaryColor });
    page1.drawText(subj.name, { x: x + 3, y: currentY - 10, size: 7, font: boldFont, color: white });
    page1.drawRectangle({ x, y: currentY - 28, width: colWidth - 3, height: 14, borderColor: primaryColor, borderWidth: 0.8, color: white });
    page1.drawText(`${subj.mark} / 100`, { x: x + 3, y: currentY - 24, size: 8, font: boldFont, color: rgb(0, 0, 0) });
  });
  currentY -= 35;

  // Cut-off Box
  const cutoff = ((values.physicsMarks + values.chemistryMarks) / 2 + values.mathsMarks).toFixed(2);
  const cutoffNum = parseFloat(cutoff);
  
  let eligibilityText = "";
  let eligibilityColor = successGreen;
  if (cutoffNum >= 179) eligibilityText = "ELIGIBLE - Round 1 (179-200)";
  else if (cutoffNum >= 150) eligibilityText = "ELIGIBLE - Round 2 (150-178)";
  else if (cutoffNum >= 80) eligibilityText = "ELIGIBLE - Round 3 (80-149)";
  else { eligibilityText = "NOT ELIGIBLE (Min 80 required)"; eligibilityColor = rgb(0.7, 0, 0); }

  page1.drawRectangle({ x: marginLeft, y: currentY - 32, width: rightColumnX - marginLeft, height: 32, color: rgb(0.94, 0.98, 0.94), borderColor: successGreen, borderWidth: 1.5 });
  page1.drawText("CUT-OFF MARK (P+C)/2+M:", { x: marginLeft + 6, y: currentY - 12, size: 7, font, color: darkGray });
  page1.drawText(`${cutoff} / 200`, { x: marginLeft + 6, y: currentY - 26, size: 12, font: boldFont, color: successGreen });
  page1.drawText(eligibilityText, { x: marginLeft + 90, y: currentY - 26, size: 8, font: boldFont, color: eligibilityColor });
  currentY -= 40;

  // Section 4: Course Information
  drawSection("COURSE INFORMATION");
  drawRow("Applied Course", values.course, lightGray);
  drawRow("First Graduate", values.firstGraduate === "yes" ? "Yes" : "No");
  currentY -= 5;

  // Section 5: Documents Checklist
  drawSection("DOCUMENTS SUBMITTED");
  
  const docs = [
    { name: "Photo", file: photoFile },
    { name: "10th Marksheet", file: certificates?.tenthMarksheetFile },
    { name: "12th Marksheet", file: certificates?.twelfthMarksheetFile },
    { name: "Aadhaar Card", file: certificates?.aadharFile },
    { name: "Community Cert", file: certificates?.communityCertFile },
    { name: "Nativity Cert", file: certificates?.nativityCertFile },
    { name: "Birth Cert", file: certificates?.birthCertFile },
    { name: "School TC/DC", file: certificates?.schoolTcDcFile },
    { name: "Income Cert", file: certificates?.incomeCertFile },
    { name: "First Grad Proof", file: certificates?.firstGradProofFile }
  ];

  const docsPerRow = 2;
  const docColWidth = (rightColumnX - marginLeft - 10) / docsPerRow;
  
  docs.forEach((doc, i) => {
    const row = Math.floor(i / docsPerRow);
    const col = i % docsPerRow;
    const x = marginLeft + 5 + (col * docColWidth);
    const y = currentY - (row * 12) - 5;
    
    const isSubmitted = doc.file !== undefined;
    page1.drawText(isSubmitted ? "[X]" : "[ ]", { x, y, size: 8, font: boldFont, color: isSubmitted ? successGreen : rgb(0.6, 0, 0) });
    page1.drawText(doc.name, { x: x + 18, y, size: 7, font, color: rgb(0.2, 0.2, 0.2) });
  });
  currentY -= (Math.ceil(docs.length / docsPerRow) * 12) + 10;

  // Declaration
  page1.drawRectangle({ x: marginLeft, y: currentY - 28, width: contentWidth, height: 28, color: rgb(0.98, 0.95, 0.88), borderColor: accentColor, borderWidth: 1 });
  page1.drawText("DECLARATION", { x: marginLeft + 5, y: currentY - 10, size: 8, font: boldFont, color: primaryColor });
  page1.drawText("I hereby declare that all information provided is true and correct to the best of my knowledge.", { x: marginLeft + 5, y: currentY - 22, size: 7, font, color: darkGray });
  currentY -= 35;

  // Signature area
  page1.drawText("Applicant Signature: ______________________", { x: marginLeft, y: currentY - 10, size: 8, font, color: darkGray });
  page1.drawText("Date: _______________", { x: pageWidth - marginRight - 120, y: currentY - 10, size: 8, font, color: darkGray });

  // ========== CERTIFICATE PAGES ==========
  // Helper to add certificate page
  async function addCertificatePage(title: string, file: File) {
    const certPage = pdfDoc.addPage([pageWidth, pageHeight]);
    allPages.push(certPage);
    
    const startY = await addPageHeader(certPage, "ATTACHED DOCUMENT");
    
    // Document title bar
    certPage.drawRectangle({ x: marginLeft, y: startY - 25, width: contentWidth, height: 25, color: lightGray, borderColor: borderGray, borderWidth: 1 });
    certPage.drawText(title.toUpperCase(), { x: marginLeft + 10, y: startY - 17, size: 10, font: boldFont, color: primaryColor });
    certPage.drawText(`Applicant: ${values.fullName}`, { x: pageWidth - marginRight - 150, y: startY - 17, size: 8, font, color: darkGray });

    // Embed document image
    const contentStartY = startY - 40;
    const contentEndY = marginBottom + 10;
    const availableHeight = contentStartY - contentEndY;
    const availableWidth = contentWidth - 20;

    try {
      const fileBytes = await fileToArrayBuffer(file);
      let image;
      
      if (file.type === "image/png") {
        image = await pdfDoc.embedPng(fileBytes);
      } else if (file.type === "image/jpeg" || file.type === "image/jpg") {
        image = await pdfDoc.embedJpg(fileBytes);
      } else {
        // For non-image files (PDF), show placeholder
        certPage.drawRectangle({ x: marginLeft + 10, y: contentEndY + 10, width: availableWidth, height: availableHeight - 20, borderColor: borderGray, borderWidth: 1, color: rgb(0.98, 0.98, 0.98) });
        certPage.drawText("Document uploaded (PDF format)", { x: marginLeft + 80, y: contentEndY + availableHeight / 2, size: 10, font, color: darkGray });
        certPage.drawText(`File: ${file.name}`, { x: marginLeft + 80, y: contentEndY + availableHeight / 2 - 15, size: 8, font, color: darkGray });
        return;
      }

      // Scale image to fit
      const scale = Math.min(availableWidth / image.width, availableHeight / image.height, 1);
      const scaledWidth = image.width * scale;
      const scaledHeight = image.height * scale;
      
      // Center the image
      const imgX = marginLeft + 10 + (availableWidth - scaledWidth) / 2;
      const imgY = contentEndY + (availableHeight - scaledHeight) / 2;

      // Border around image
      certPage.drawRectangle({ x: imgX - 5, y: imgY - 5, width: scaledWidth + 10, height: scaledHeight + 10, borderColor: primaryColor, borderWidth: 1, color: white });
      
      certPage.drawImage(image, { x: imgX, y: imgY, width: scaledWidth, height: scaledHeight });
    } catch (err) {
      console.error(`Failed to embed ${title}:`, err);
      certPage.drawRectangle({ x: marginLeft + 10, y: contentEndY + 10, width: availableWidth, height: availableHeight - 20, borderColor: borderGray, borderWidth: 1, color: rgb(0.98, 0.98, 0.98) });
      certPage.drawText(`Failed to embed: ${file.name}`, { x: marginLeft + 80, y: contentEndY + availableHeight / 2, size: 10, font, color: rgb(0.7, 0, 0) });
    }
  }

  // Add certificate pages in order
  const certificateList: { title: string; file?: File }[] = [
    { title: "Student Photograph", file: photoFile },
    { title: "10th Marksheet", file: certificates?.tenthMarksheetFile },
    { title: "12th Marksheet", file: certificates?.twelfthMarksheetFile },
    { title: "Aadhaar Card", file: certificates?.aadharFile },
    { title: "Community Certificate", file: certificates?.communityCertFile },
    { title: "Nativity Certificate", file: certificates?.nativityCertFile },
    { title: "Birth Certificate", file: certificates?.birthCertFile },
    { title: "School TC/DC", file: certificates?.schoolTcDcFile },
    { title: "Income Certificate", file: certificates?.incomeCertFile },
    { title: "First Graduate Proof", file: certificates?.firstGradProofFile }
  ];

  for (const cert of certificateList) {
    if (cert.file) {
      await addCertificatePage(cert.title, cert.file);
    }
  }

  // Add page footers with correct total page count
  const totalPages = allPages.length;
  allPages.forEach((page, index) => {
    addPageFooter(page, index + 1, totalPages);
  });

  const pdfBytes = await pdfDoc.save();
  const blob = new Blob([new Uint8Array(pdfBytes)], { type: "application/pdf" });
  const url = URL.createObjectURL(blob);
  return { blob, url, appId };
}

// MAIN COMPONENT
export default function AdmissionsPage() {
  useEffect(() => {
    document.title = "Admissions | SSM Institute of Engineering and Technology";
  }, []);

  const form = useForm<AdmissionFormValues>({
    resolver: zodResolver(schema),
    defaultValues: {
      fullName: "",
      guardianName: "",
      dob: "",
      phone: "",
      email: "",
      street: "",
      city: "",
      district: "",
      state: "Tamil Nadu",
      pincode: "",
      tenthMarks: "",
      tenthBoard: "State Board",
      twelfthMarks: "",
      twelfthBoard: "State Board",
      physicsMarks: 0,
      chemistryMarks: 0,
      mathsMarks: 0,
      course: "",
      aadharNumber: "",
      firstGraduate: "no",
    },
  });

  // State for File Uploads
  const [photoFile, setPhotoFile] = useState<File | undefined>();
  const [tenthMarksheetFile, setTenthMarksheetFile] = useState<File | undefined>();
  const [twelfthMarksheetFile, setTwelfthMarksheetFile] = useState<File | undefined>();
  const [aadharFile, setAadharFile] = useState<File | undefined>();
  const [communityCertFile, setCommunityCertFile] = useState<File | undefined>();
  const [nativityCertFile, setNativityCertFile] = useState<File | undefined>();
  const [birthCertFile, setBirthCertFile] = useState<File | undefined>();
  const [schoolTcDcFile, setSchoolTcDcFile] = useState<File | undefined>();
  const [incomeCertFile, setIncomeCertFile] = useState<File | undefined>();
  const [firstGradProofFile, setFirstGradProofFile] = useState<File | undefined>();
  
  // UI States (Declaration & Payment)
  const [showDeclarationDialog, setShowDeclarationDialog] = useState(false);
  const [showPaymentModal, setShowPaymentModal] = useState(false);
  const [paymentStatus, setPaymentStatus] = useState<'idle' | 'processing' | 'success'>('idle');
  const [pendingFormData, setPendingFormData] = useState<AdmissionFormValues | null>(null);

  const selectedCourse = form.watch("course");
  const firstGrad = form.watch("firstGraduate");

  // Watch subject marks for real-time cut-off calculation
  const physicsMarks = form.watch("physicsMarks") || 0;
  const chemistryMarks = form.watch("chemistryMarks") || 0;
  const mathsMarks = form.watch("mathsMarks") || 0;

  // Calculate cut-off mark (only when all three marks are entered) - Out of 200
  const cutoffMark = useMemo(() => {
    if (physicsMarks > 0 && chemistryMarks > 0 && mathsMarks > 0) {
      const cutoff = (physicsMarks + chemistryMarks) / 2 + mathsMarks;
      return cutoff.toFixed(2);
    }
    return "0.00";
  }, [physicsMarks, chemistryMarks, mathsMarks]);

  const handleFormSubmit = async (values: AdmissionFormValues) => {
    console.log("Form submitted", values);
    
    // Validation checks for files
    if (!photoFile) { toast.error("Student photo is mandatory."); return; }
    if (!aadharFile) { toast.error("Please upload the Aadhaar card attachment."); return; }
    if (!communityCertFile) { toast.error("Please upload the Community certificate."); return; }
    if (!nativityCertFile) { toast.error("Please upload the Nativity certificate."); return; }
    if (!birthCertFile) { toast.error("Please upload the Birth certificate."); return; }
    if (!schoolTcDcFile) { toast.error("Please upload the School TC/DC certificate."); return; }
    if (!incomeCertFile) { toast.error("Please upload the Income certificate."); return; }
    if (values.firstGraduate === "yes" && !firstGradProofFile) { toast.error("Please upload the First Graduate proof."); return; }
    if (!tenthMarksheetFile) { toast.error("Please upload the 10th Marksheet."); return; }
    if (!twelfthMarksheetFile) { toast.error("Please upload the 12th Marksheet."); return; }

    // Show declaration dialog
    setPendingFormData(values);
    setShowDeclarationDialog(true);
  };

  // --- NEW HANDLER: Transition from Declaration to Payment ---
  const onDeclarationAccept = () => {
    setShowDeclarationDialog(false);
    setShowPaymentModal(true); // Open Mock Payment Gateway
  };

  // --- NEW HANDLER: Process Mock Payment ---
  const handleProcessPayment = async () => {
    setPaymentStatus('processing');
    
    // Simulate Bank Delay (3 seconds)
    await new Promise(resolve => setTimeout(resolve, 3000));
    
    setPaymentStatus('success');
    
    // Wait 1.5 second to show Success tick, then trigger final submission
    setTimeout(async () => {
        await finalSubmission();
    }, 1500);
  };

  // --- RENAMED: Final Backend Submission (Triggered after Payment) ---
  const finalSubmission = async () => {
    if (!pendingFormData) return;
    
    const values = pendingFormData;
    
    try {
      // 1. Generate the PDF locally
      const { blob, url, appId } = await generatePdf(values, photoFile, {
        tenthMarksheetFile,
        twelfthMarksheetFile,
        aadharFile,
        communityCertFile,
        nativityCertFile,
        birthCertFile,
        schoolTcDcFile,
        incomeCertFile,
        firstGradProofFile,
      });
      
      // 2. Generate Mock Transaction ID
      const mockTxnId = "TXN" + Math.floor(Math.random() * 1000000000);

      // 3. Send to Backend (Mailman)
      toast.info("Submitting application and sending confirmation email...");

      const formData = new FormData();
      // 'pdf' matches the server's upload.single('pdf')
      formData.append('pdf', blob, `${values.fullName.replace(/\s+/g, "_")}_SSMIET_Application.pdf`);
      
      // Additional Data for the Email body
      formData.append('email', values.email);
      formData.append('name', values.fullName);
      formData.append('course', values.course);
      formData.append('cutoff', ((values.physicsMarks + values.chemistryMarks) / 2 + values.mathsMarks).toFixed(2));
      formData.append('payment_id', mockTxnId); // Attach Mock Payment ID

      // 4. Backend Call - CORRECTED URL HERE
      const response = await fetch('https://ssmiet-backend.onrender.com', {
        method: 'POST',
        body: formData,
      });

      if (response.ok) {
        toast.success(`Application submitted! Payment Verified: ${mockTxnId}`);
        // 5. Download PDF for student on success
        const a = document.createElement("a");
        a.href = url;
        a.download = `${values.fullName.replace(/\s+/g, "_")}_SSMIET_Application.pdf`;
        a.click();
      } else {
        const errText = await response.text();
        console.error("Backend Error:", errText);
        toast.warning("Payment verified, PDF downloaded, but email delivery failed.");
      }
      
      // Cleanup
      URL.revokeObjectURL(url);
      setShowPaymentModal(false);
      setPaymentStatus('idle');
      setPendingFormData(null);
      form.reset();

    } catch (e) {
      console.error("Submission Error:", e);
      toast.error("An error occurred during submission. Please try again.");
      setShowPaymentModal(false);
      setPaymentStatus('idle');
    }
  };

  return (
    <div className="min-h-screen bg-background">
      <Header />
      <main className="container py-10">
        <Card>
          <CardHeader>
            <CardTitle>SSMIET Admissions - Application Form</CardTitle>
          </CardHeader>
          <CardContent>
            <Form {...form}>
              <form onSubmit={form.handleSubmit(handleFormSubmit)} className="grid gap-6">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  <FormField
                    control={form.control}
                    name="fullName"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Student's Full Name</FormLabel>
                        <FormControl>
                          <Input {...field} placeholder="e.g., Veera" />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />

                  <FormField
                    control={form.control}
                    name="guardianName"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Parent/Guardian Name</FormLabel>
                        <FormControl>
                          <Input {...field} placeholder="e.g., R. Kumar" />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />

                  <FormField
                    control={form.control}
                    name="dob"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Date of Birth</FormLabel>
                        <FormControl>
                          <Input type="date" {...field} />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />

                  <FormField
                    control={form.control}
                    name="phone"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Contact Number</FormLabel>
                        <FormControl>
                          <Input inputMode="numeric" maxLength={10} placeholder="10-digit number" {...field} />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />

                  <FormField control={form.control} name="aadharNumber" render={({ field }) => (
                    <FormItem>
                      <FormLabel>Aadhaar Number</FormLabel>
                      <FormControl>
                        <Input inputMode="numeric" maxLength={12} placeholder="12-digit Aadhaar" {...field} />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )} />

                  <FormField
                    control={form.control}
                    name="email"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Email Address</FormLabel>
                        <FormControl>
                          <Input type="email" placeholder="name@example.com" {...field} />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  <FormField
                    control={form.control}
                    name="street"
                    render={({ field }) => (
                      <FormItem className="md:col-span-2">
                        <FormLabel>Street Address</FormLabel>
                        <FormControl>
                          <Textarea rows={2} placeholder="House No, Street Name" {...field} />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />

                  <FormField control={form.control} name="city" render={({ field }) => (
                    <FormItem>
                      <FormLabel>City</FormLabel>
                      <FormControl>
                        <Input {...field} />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )} />

                  <FormField control={form.control} name="district" render={({ field }) => (
                    <FormItem>
                      <FormLabel>District</FormLabel>
                      <FormControl>
                        <Input {...field} />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )} />

                  <FormField control={form.control} name="state" render={({ field }) => (
                    <FormItem>
                      <FormLabel>State</FormLabel>
                      <FormControl>
                        <Input {...field} />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )} />

                  <FormField control={form.control} name="pincode" render={({ field }) => (
                    <FormItem>
                      <FormLabel>Pincode</FormLabel>
                      <FormControl>
                        <Input inputMode="numeric" maxLength={6} {...field} />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )} />
                </div>

                {/* 10th Standard Section */}
                <Card className="border-primary/20">
                  <CardHeader>
                    <CardTitle className="text-lg">10th Standard Details</CardTitle>
                  </CardHeader>
                  <CardContent>
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                      <FormField control={form.control} name="tenthMarks" render={({ field }) => (
                        <FormItem>
                          <FormLabel>10th Marks / Percentage</FormLabel>
                          <FormControl>
                            <Input placeholder="e.g., 472 / 500 or 94.4%" {...field} />
                          </FormControl>
                          <FormMessage />
                        </FormItem>
                      )} />

                      <FormField control={form.control} name="tenthBoard" render={({ field }) => (
                        <FormItem>
                          <FormLabel>10th Board of Education</FormLabel>
                          <FormControl>
                            <Input placeholder="e.g., TN State Board / CBSE / ICSE" {...field} />
                          </FormControl>
                          <FormMessage />
                        </FormItem>
                      )} />

                      <div className="md:col-span-2">
                        <label className="block text-sm font-medium mb-2">10th Marksheet <span className="text-destructive">*</span></label>
                        <Input
                          type="file"
                          accept="application/pdf,image/*"
                          onChange={(e) => {
                            const f = e.target.files?.[0];
                            if (f && f.size > 5 * 1024 * 1024) {
                              toast.error("File must be under 5MB");
                              return;
                            }
                            setTenthMarksheetFile(f);
                          }}
                        />
                        <p className="mt-2 text-xs text-muted-foreground">PDF or image, max 5MB.</p>
                      </div>
                    </div>
                  </CardContent>
                </Card>

                {/* 12th Standard Section */}
                <Card className="border-primary/20 bg-primary/5">
                  <CardHeader>
                    <CardTitle className="text-lg">12th Standard Details</CardTitle>
                    <p className="text-sm text-muted-foreground mt-1">
                      Enter your 12th standard marks and board information
                    </p>
                  </CardHeader>
                  <CardContent className="space-y-6">
                    {/* 12th Total Marks and Board */}
                    <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                      <FormField control={form.control} name="twelfthMarks" render={({ field }) => (
                        <FormItem>
                          <FormLabel>12th Total Marks / Percentage</FormLabel>
                          <FormControl>
                            <Input placeholder="e.g., 565 / 600 or 94.16%" {...field} />
                          </FormControl>
                          <FormMessage />
                        </FormItem>
                      )} />

                      <FormField control={form.control} name="twelfthBoard" render={({ field }) => (
                        <FormItem>
                          <FormLabel>12th Board of Education</FormLabel>
                          <FormControl>
                            <Input placeholder="e.g., TN State Board / CBSE" {...field} />
                          </FormControl>
                          <FormMessage />
                        </FormItem>
                      )} />

                      <div>
                        <label className="block text-sm font-medium mb-2">12th Marksheet <span className="text-destructive">*</span></label>
                        <Input
                          type="file"
                          accept="application/pdf,image/*"
                          onChange={(e) => {
                            const f = e.target.files?.[0];
                            if (f && f.size > 5 * 1024 * 1024) {
                              toast.error("File must be under 5MB");
                              return;
                            }
                            setTwelfthMarksheetFile(f);
                          }}
                        />
                        <p className="mt-2 text-xs text-muted-foreground">PDF or image, max 5MB.</p>
                      </div>
                    </div>

                    {/* Subject-wise Marks */}
                    <div className="pt-4 border-t border-primary/20">
                      <h4 className="text-sm font-semibold mb-3 text-foreground">Subject-wise Marks (for Cut-off Calculation)</h4>
                      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                        
                        <FormField control={form.control} name="physicsMarks" render={({ field }) => (
                          <FormItem>
                            <FormLabel>Physics Marks <span className="text-destructive">*</span></FormLabel>
                            <FormControl>
                              <Input 
                                type="number" 
                                placeholder="0-100" 
                                min="0" 
                                max="100" 
                                {...field} 
                                onChange={(e) => {
                                  const val = e.target.valueAsNumber || 0;
                                  field.onChange(Math.min(100, Math.max(0, val)));
                                }}
                              />
                            </FormControl>
                            <FormMessage />
                          </FormItem>
                        )} />

                        <FormField control={form.control} name="chemistryMarks" render={({ field }) => (
                          <FormItem>
                            <FormLabel>Chemistry Marks <span className="text-destructive">*</span></FormLabel>
                            <FormControl>
                              <Input 
                                type="number" 
                                placeholder="0-100" 
                                min="0" 
                                max="100" 
                                {...field}
                                onChange={(e) => {
                                  const val = e.target.valueAsNumber || 0;
                                  field.onChange(Math.min(100, Math.max(0, val)));
                                }}
                              />
                            </FormControl>
                            <FormMessage />
                          </FormItem>
                        )} />

                        <FormField control={form.control} name="mathsMarks" render={({ field }) => (
                          <FormItem>
                            <FormLabel>Mathematics Marks <span className="text-destructive">*</span></FormLabel>
                            <FormControl>
                              <Input 
                                type="number" 
                                placeholder="0-100" 
                                min="0" 
                                max="100" 
                                {...field}
                                onChange={(e) => {
                                  const val = e.target.valueAsNumber || 0;
                                  field.onChange(Math.min(100, Math.max(0, val)));
                                }}
                              />
                            </FormControl>
                            <FormMessage />
                          </FormItem>
                        )} />
                      </div>
                    </div>

                    {/* Calculated Cut-off Display */}
                    <div className="mt-6 p-6 bg-gradient-to-br from-primary/5 via-primary/10 to-accent/5 border-2 border-primary/30 rounded-xl shadow-[var(--shadow-elevate)]">
                        <div className="flex flex-col md:flex-row items-center justify-between gap-4">
                          <div className="text-center md:text-left">
                            <p className="text-sm font-semibold text-muted-foreground mb-2 uppercase tracking-wide">Calculated Cut-off Mark</p>
                            <p className="text-4xl md:text-5xl font-bold text-primary">
                              {cutoffMark}
                              <span className="text-xl md:text-2xl text-primary/70 ml-2">/ 200</span>
                            </p>
                          </div>
                          <div className="text-center md:text-right bg-card px-4 py-3 rounded-lg border border-border shadow-sm">
                            <p className="text-xs font-semibold text-accent mb-1 uppercase">Formula</p>
                            <p className="text-sm font-mono font-bold text-primary">(P + C) / 2 + M</p>
                          </div>
                        </div>
                        
                        {/* Eligibility Status */}
                        {parseFloat(cutoffMark) > 0 && (
                          <div className="mt-4 pt-4 border-t border-primary/20">
                            {parseFloat(cutoffMark) >= 179 && parseFloat(cutoffMark) <= 200 && (
                              <div className="flex items-center gap-3 p-4 bg-gradient-to-r from-primary to-accent rounded-lg shadow-[var(--shadow-elevate)]">
                                <div className="flex-shrink-0 w-12 h-12 bg-white/20 rounded-full flex items-center justify-center">
                                  <span className="text-2xl">🎉</span>
                                </div>
                                <div className="flex-1">
                                  <p className="text-white font-bold text-lg">Congratulations!</p>
                                  <p className="text-white/90 text-sm">You are eligible for Round 1 Counselling (179-200 marks)</p>
                                </div>
                              </div>
                            )}
                            {parseFloat(cutoffMark) >= 150 && parseFloat(cutoffMark) <= 178 && (
                              <div className="flex items-center gap-3 p-4 bg-gradient-to-r from-primary/80 to-primary rounded-lg shadow-lg">
                                <div className="flex-shrink-0 w-12 h-12 bg-white/20 rounded-full flex items-center justify-center">
                                  <span className="text-2xl">✓</span>
                                </div>
                                <div className="flex-1">
                                  <p className="text-white font-bold text-lg">Well Done!</p>
                                  <p className="text-white/90 text-sm">You are eligible for Round 2 Counselling (150-178 marks)</p>
                                </div>
                              </div>
                            )}
                            {parseFloat(cutoffMark) >= 80 && parseFloat(cutoffMark) <= 149 && (
                              <div className="flex items-center gap-3 p-4 bg-gradient-to-r from-accent/90 to-accent rounded-lg shadow-lg">
                                <div className="flex-shrink-0 w-12 h-12 bg-white/20 rounded-full flex items-center justify-center">
                                  <span className="text-2xl">📋</span>
                                </div>
                                <div className="flex-1">
                                  <p className="text-white font-bold text-lg">Good Effort!</p>
                                  <p className="text-white/90 text-sm">You are eligible for Round 3 Counselling (80-149 marks)</p>
                                </div>
                              </div>
                            )}
                            {parseFloat(cutoffMark) < 80 && parseFloat(cutoffMark) > 0 && (
                              <div className="flex items-center gap-3 p-4 bg-gradient-to-r from-destructive/80 to-destructive rounded-lg shadow-lg">
                                <div className="flex-shrink-0 w-12 h-12 bg-white/20 rounded-full flex items-center justify-center">
                                  <span className="text-2xl">ℹ️</span>
                                </div>
                                <div className="flex-1">
                                  <p className="text-white font-bold text-lg">Not Eligible</p>
                                  <p className="text-white/90 text-sm">Unfortunately, you are not eligible for admission (Minimum 80 marks required)</p>
                                </div>
                              </div>
                            )}
                          </div>
                        )}
                    </div>
                  </CardContent>
                </Card>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  <FormField
                    control={form.control}
                    name="course"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Desired Course</FormLabel>
                        <Select onValueChange={field.onChange} defaultValue={field.value}>
                          <FormControl>
                            <SelectTrigger>
                              <SelectValue placeholder="Select a course" />
                            </SelectTrigger>
                          </FormControl>
                          <SelectContent>
                            {courses.map((c) => (
                              <SelectItem key={c} value={c}>{c}</SelectItem>
                            ))}
                          </SelectContent>
                        </Select>
                        <FormMessage />
                      </FormItem>
                    )}
                  />

                  <div>
                    <label className="block text-sm font-medium mb-2">Passport-sized Photograph</label>
                    <Input
                      type="file"
                      accept="image/png, image/jpeg"
                      onChange={(e) => {
                        const f = e.target.files?.[0];
                        if (f && f.size > 2 * 1024 * 1024) {
                          toast.error("Image size should be under 2MB");
                          return;
                        }
                        setPhotoFile(f);
                      }}
                    />
                    <p className="mt-2 text-xs text-muted-foreground">PNG or JPG, max 2MB.</p>
                  </div>
                  </div>

                  <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                    <FormField
                      control={form.control}
                      name="firstGraduate"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel>First Graduate</FormLabel>
                          <Select onValueChange={field.onChange} defaultValue={field.value}>
                            <FormControl>
                              <SelectTrigger>
                                <SelectValue placeholder="Select Yes/No" />
                              </SelectTrigger>
                            </FormControl>
                            <SelectContent>
                              <SelectItem value="no">No</SelectItem>
                              <SelectItem value="yes">Yes</SelectItem>
                            </SelectContent>
                          </Select>
                          <FormMessage />
                        </FormItem>
                      )}
                    />

                    <div>
                      <label className="block text-sm font-medium mb-2">Aadhaar Card Attachment</label>
                      <Input
                        type="file"
                        accept="application/pdf,image/*"
                        onChange={(e) => {
                          const f = e.target.files?.[0];
                          if (f && f.size > 5 * 1024 * 1024) {
                            toast.error("File must be under 5MB");
                            return;
                          }
                          setAadharFile(f);
                        }}
                      />
                      <p className="mt-2 text-xs text-muted-foreground">PDF or image, max 5MB.</p>
                    </div>

                    <div>
                      <label className="block text-sm font-medium mb-2">Community Certificate</label>
                      <Input
                        type="file"
                        accept="application/pdf,image/*"
                        onChange={(e) => {
                          const f = e.target.files?.[0];
                          if (f && f.size > 5 * 1024 * 1024) {
                            toast.error("File must be under 5MB");
                            return;
                          }
                          setCommunityCertFile(f);
                        }}
                      />
                      <p className="mt-2 text-xs text-muted-foreground">PDF or image, max 5MB.</p>
                    </div>

                    <div>
                      <label className="block text-sm font-medium mb-2">Nativity Certificate</label>
                      <Input
                        type="file"
                        accept="application/pdf,image/*"
                        onChange={(e) => {
                          const f = e.target.files?.[0];
                          if (f && f.size > 5 * 1024 * 1024) {
                            toast.error("File must be under 5MB");
                            return;
                          }
                          setNativityCertFile(f);
                        }}
                      />
                      <p className="mt-2 text-xs text-muted-foreground">PDF or image, max 5MB.</p>
                    </div>

                    <div>
                      <label className="block text-sm font-medium mb-2">Birth Certificate</label>
                      <Input
                        type="file"
                        accept="application/pdf,image/*"
                        onChange={(e) => {
                          const f = e.target.files?.[0];
                          if (f && f.size > 5 * 1024 * 1024) {
                            toast.error("File must be under 5MB");
                            return;
                          }
                          setBirthCertFile(f);
                        }}
                      />
                      <p className="mt-2 text-xs text-muted-foreground">PDF or image, max 5MB.</p>
                    </div>

                    <div>
                      <label className="block text-sm font-medium mb-2">School Transfer/Conduct Certificate (TC/DC)</label>
                      <Input
                        type="file"
                        accept="application/pdf,image/*"
                        onChange={(e) => {
                          const f = e.target.files?.[0];
                          if (f && f.size > 5 * 1024 * 1024) {
                            toast.error("File must be under 5MB");
                            return;
                          }
                          setSchoolTcDcFile(f);
                        }}
                      />
                      <p className="mt-2 text-xs text-muted-foreground">PDF or image, max 5MB.</p>
                    </div>
                    <div>
                      <label className="block text-sm font-medium mb-2">Income Certificate</label>
                      <Input
                        type="file"
                        accept="application/pdf,image/*"
                        onChange={(e) => {
                          const f = e.target.files?.[0];
                          if (f && f.size > 5 * 1024 * 1024) {
                            toast.error("File must be under 5MB");
                            return;
                          }
                          setIncomeCertFile(f);
                        }}
                      />
                      <p className="mt-2 text-xs text-muted-foreground">PDF or image, max 5MB.</p>
                    </div>

                    {firstGrad === "yes" && (
                      <div className="md:col-span-2">
                        <label className="block text-sm font-medium mb-2">First Graduate Proof</label>
                        <Input
                          type="file"
                          accept="application/pdf,image/*"
                          onChange={(e) => {
                            const f = e.target.files?.[0];
                            if (f && f.size > 5 * 1024 * 1024) {
                              toast.error("File must be under 5MB");
                              return;
                            }
                            setFirstGradProofFile(f);
                          }}
                        />
                        <p className="mt-2 text-xs text-muted-foreground">Required if selected Yes. PDF or image, max 5MB.</p>
                      </div>
                    )}
                  </div>

                  <div className="flex items-center justify-end gap-3">
                  <Button type="button" variant="secondary" onClick={() => form.reset()}>
                    Reset
                  </Button>
                  <Button type="submit">Submit Application</Button>
                </div>
              </form>
            </Form>
          </CardContent>
        </Card>

        {/* Declaration Dialog */}
        <AlertDialog open={showDeclarationDialog} onOpenChange={setShowDeclarationDialog}>
          <AlertDialogContent>
            <AlertDialogHeader>
              <AlertDialogTitle className="flex items-center gap-2">
                <span className="text-2xl">⚠️</span>
                Declaration
              </AlertDialogTitle>
              <AlertDialogDescription className="text-base pt-4">
                <strong className="text-destructive">Important Notice:</strong>
                <p className="mt-2">
                  All information provided must be true and authentic. Submission of unverifiable or fraudulent documents will result in application invalidation.
                </p>
                <p className="mt-4 font-semibold">
                  By proceeding, you confirm that all the information and documents you have submitted are genuine and accurate.
                </p>
              </AlertDialogDescription>
            </AlertDialogHeader>
            <AlertDialogFooter>
              <AlertDialogCancel>Cancel</AlertDialogCancel>
              <AlertDialogAction onClick={onDeclarationAccept}>
                I Agree, Proceed to Payment
              </AlertDialogAction>
            </AlertDialogFooter>
          </AlertDialogContent>
        </AlertDialog>

        {/* --- MOCK PAYMENT MODAL (The "Extras") --- */}
        <AlertDialog open={showPaymentModal}>
            <AlertDialogContent className="max-w-md">
                <AlertDialogHeader>
                    <AlertDialogTitle className="flex items-center gap-2">
                        <CreditCard className="h-6 w-6 text-primary" />
                        SSMIET Payment Gateway
                    </AlertDialogTitle>
                </AlertDialogHeader>
                
                <div className="py-6">
                    {paymentStatus === 'idle' && (
                        <div className="space-y-4">
                            <div className="flex justify-between items-center p-4 bg-secondary/20 rounded-lg border">
                                <span className="text-sm font-medium">Application Fee</span>
                                <span className="text-xl font-bold">₹50.00</span>
                            </div>
                            <div className="text-xs text-muted-foreground text-center">
                                Secure Payment powered by SSMIET Tech
                            </div>
                        </div>
                    )}

                    {paymentStatus === 'processing' && (
                        <div className="flex flex-col items-center justify-center py-4 space-y-4">
                            <Loader2 className="h-12 w-12 animate-spin text-primary" />
                            <p className="text-sm font-medium animate-pulse">Contacting Bank...</p>
                        </div>
                    )}

                    {paymentStatus === 'success' && (
                        <div className="flex flex-col items-center justify-center py-4 space-y-4">
                            <CheckCircle2 className="h-16 w-16 text-green-500 scale-125 transition-all" />
                            <p className="text-lg font-bold text-green-600">Payment Successful!</p>
                        </div>
                    )}
                </div>

                {paymentStatus === 'idle' && (
                    <AlertDialogFooter>
                        <Button variant="outline" onClick={() => setShowPaymentModal(false)}>Cancel</Button>
                        <Button onClick={handleProcessPayment} className="bg-primary px-8">Pay ₹50.00</Button>
                    </AlertDialogFooter>
                )}
            </AlertDialogContent>
        </AlertDialog>

      </main>
    </div>
  );
}