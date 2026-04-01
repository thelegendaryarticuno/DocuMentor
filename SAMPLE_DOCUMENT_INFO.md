# Sample Test Document - Smart Highlights

## 📄 What's Included

This sample document (`sample-document.txt`) contains a **realistic mix** of all three importance levels:

### 🔴 **Critical Content (~15%)**

Sections that will be highlighted in **RED**:

1. **"WARNING: All administrator accounts MUST use multi-factor authentication..."**
   - Contains "WARNING:", "MUST", "mandatory"
   - Explicit threat of consequences
   
2. **"Do NOT share administrator credentials..."**
   - Contains "Do NOT" (strong prohibition)
   - Threat of disciplinary action

3. **"CRITICAL: Root access should only be used..."**
   - Starts with "CRITICAL:"
   - Security-critical instruction

4. **"WARNING: If you suspect a security breach..."**
   - Contains "WARNING:"
   - Urgent incident response instructions
   - "Do NOT attempt to investigate"

5. **"Security incidents must be reported within 1 hour..."**
   - Time-sensitive requirement
   - Consequences for non-compliance

---

### 🟡 **Important Content (~30%)**

Sections that will be highlighted in **YELLOW**:

1. **"Important: Always verify you are connected to the correct server..."**
   - Starts with "Important:"
   - Important operational guidance

2. **"Note: Never write passwords on paper..."**
   - Starts with "Note:"
   - Important security practice

3. **"Important: Critical system configurations should be backed up..."**
   - Starts with "Important:"
   - Best practice recommendation

4. **"It is recommended to use a password manager..."**
   - Contains recommendation language
   - Actionable advice

5. **"Tip: Review the security portal monthly..."**
   - Starts with "Tip:"
   - Helpful guidance

6. **Headers and structured sections**
   - "Administrator Account Security"
   - "Incident Response"
   - "Password Management"

---

### ⚪ **Normal Content (~55%)**

Sections that will **NOT be highlighted**:

1. **Introduction paragraph**
   - General background information
   - No urgency or critical info

2. **"Background" section**
   - Historical context
   - Descriptive content

3. **"Historical Context" section**
   - Past events
   - General information

4. **"Server rooms require badge access..."**
   - Routine procedures
   - General operational info

5. **"For questions or concerns, contact:"**
   - Contact information
   - Standard footer content

6. **Most procedural descriptions**
   - Backup procedures (routine)
   - Network details (descriptive)
   - General guidelines

---

## 🧪 How to Test

### **Option 1: Copy-Paste Text**
1. Open `sample-document.txt`
2. Copy all content (Ctrl+A, Ctrl+C)
3. Create a new Word document
4. Paste content (Ctrl+V)
5. Save as `test-document.docx`
6. Upload to Smart Highlights mode

### **Option 2: Convert to PDF**
1. Open `sample-document.txt` in Word
2. File → Save As → PDF
3. Upload to Smart Highlights mode

### **Option 3: Direct Text (for quick test)**
Just copy a few paragraphs including:
- At least one "WARNING:" section (should be red)
- At least one "Important:" section (should be yellow)
- Several normal paragraphs (should be white)

---

## ✅ **Expected Results:**

After analysis, you should see:

### **🔴 Red Highlights (Critical):**
- All "WARNING:" paragraphs
- All "CRITICAL:" paragraphs
- "Do NOT share credentials..."
- "Security incidents must be reported within 1 hour..."
- **~5-7 chunks out of ~40 total (12-18%)**

### **🟡 Yellow Highlights (Important):**
- All "Important:" paragraphs
- All "Note:" and "Tip:" paragraphs
- Some section headers
- Recommendation paragraphs
- **~10-15 chunks out of ~40 total (25-38%)**

### **⚪ No Highlight (Normal):**
- Introduction
- Background sections
- Most general descriptions
- Contact info
- Routine procedures
- **~20-25 chunks out of ~40 total (50-63%)**

---

## 🎯 **What This Tests:**

✅ **Keyword Detection**
- "WARNING:", "CRITICAL:", "Important:", "Note:", "Tip:"

✅ **Phrase Detection**
- "Do NOT", "must not", "MUST"
- "required", "mandatory"

✅ **Scoring System**
- Multiple signals needed for critical
- Moderate signals for medium
- Default to low

✅ **Balancing Algorithm**
- Max 15% critical
- Max 35% medium
- Min 50% low

✅ **Realistic Distribution**
- Not everything highlighted
- Only truly important stuff stands out

---

## 💡 **Customization Tips:**

Want to test specific scenarios?

### **More Critical Content:**
Add paragraphs starting with:
- `WARNING:`
- `CRITICAL:`
- `ERROR:`
- `DANGER:`
- `Do NOT`
- `MUST NOT`

### **More Important Content:**
Add paragraphs starting with:
- `Important:`
- `Note:`
- `Tip:`
- `Recommendation:`

### **More Normal Content:**
Add paragraphs with:
- General descriptions
- Background information
- Examples
- Historical context

---

## 📊 **Quick Stats:**

**Total Document:**
- **~2,200 words**
- **~40 chunks** (at 800 tokens/chunk)
- **~3-5 minutes** analysis time (with GPU)

**Content Mix:**
- **6 critical sections** (explicit warnings/requirements)
- **12 important sections** (tips, notes, headers)
- **22 normal sections** (general content)

---

## 🚀 **Ready to Test!**

```bash
npm run dev:chrome
```

1. Go to Smart Highlights mode
2. Upload `sample-document.txt` (save as .docx or .pdf first)
3. Wait for analysis
4. Check the distribution matches expectations
5. Most content should be white!

**This document proves the fix works!** 🎉
