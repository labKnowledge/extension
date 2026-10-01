---
name: extension-publisher
description: Comprehensive browser extension publishing assistant for Chrome Web Store and Firefox Add-ons (AMO). Handles manifest validation, asset generation, store listing preparation, and submission guidance.
author: Claude Code Builder
version: 1.0.0
---

# Extension Publisher Skill

A comprehensive skill for publishing browser extensions to Chrome Web Store and Firefox Add-ons (AMO). This skill handles the complete publishing workflow from validation to submission.

## Capabilities

### 1. Manifest Validation
- Validates manifest.json for Chrome Web Store requirements
- Validates manifest.json for Firefox Add-ons (AMO) requirements
- Checks manifest version compatibility
- Validates permissions and host permissions
- Checks for required fields (name, version, description, icons)
- Validates Firefox-specific settings (browser_specific_settings)
- Checks service_worker compatibility
- Validates content_scripts configuration
- Detects common validation errors

### 2. Icon Generation & Validation
- Validates existing icon sizes (16, 32, 48, 96, 128px)
- Checks icon format (PNG) and transparency
- Generates missing icons from source SVG
- Creates store-specific icons (128x128, 96x96, 48x48)
- Validates icon quality and resolution
- Optimizes icon file sizes

### 3. Screenshot Creation & Validation
- Validates screenshot dimensions (1280x800, 640x400)
- Checks screenshot format (PNG/JPEG)
- Generates multiple screenshot sizes
- Creates consistent screenshot styles
- Validates screenshot content quality
- Organizes screenshots by size

### 4. Privacy Policy Validation
- Checks privacy policy URL in manifest
- Validates privacy policy content requirements
- Ensures data collection disclosure
- Checks privacy policy hosting status
- Validates compliance with store policies
- Generates privacy policy if missing

### 5. Store Listing Preparation
- Generates short descriptions (132 chars max)
- Creates long descriptions with features
- Prepares permission justifications
- Creates feature bullet points
- Generates screenshot captions
- Prepares category recommendations
- Creates support information

### 6. Asset Packaging
- Creates clean .zip packages for submission
- Excludes development files (.git, docs, scripts)
- Validates package contents
- Checks file size limits
- Creates versioned packages
- Generates package manifests

### 7. Pre-submission Checklist
- Comprehensive validation of all requirements
- Checks manifest completeness
- Validates all assets are present
- Verifies privacy policy is hosted
- Checks permission justifications
- Validates store listing copy
- Screenshots common rejection reasons

### 8. Submission Guidance
- Step-by-step Chrome Web Store submission
- Step-by-step Firefox Add-ons submission
- Provides store-specific URLs
- Handles common submission errors
- Guides through review process
- Provides troubleshooting tips

## Usage Examples

### Example 1: Analyze and Validate Extension Project
```bash
# Navigate to your extension project
cd /path/to/your-extension

# Run comprehensive analysis
extension-publisher analyze

# Output shows:
# - Manifest validation results
# - Missing icons or screenshots
# - Privacy policy status
# - Asset checklist
# - Pre-submission recommendations
```

### Example 2: Generate Missing Assets
```bash
# Generate missing icon sizes from SVG
extension-publisher generate-icons --source icons/icon.svg

# Generate screenshots in multiple sizes
extension-publisher generate-screenshots --sizes 1280x800,640x400

# Output shows:
# - Created icons/icon-48.png
# - Created icons/icon-96.png
# - Created icons/icon-128.png
# - Created screenshots/popup-1280x800.png
# - Created screenshots/popup-640x400.png
```

### Example 3: Prepare Store Submission Package
```bash
# Create publication-ready package
extension-publisher package --chrome

# Creates:
# - dist/extension-name-version.zip
# - docs/chrome-store-listing.md
# - docs/permission-justifications.md
# - docs/submission-checklist.md

# For Firefox
extension-publisher package --firefox

# Creates Firefox-specific package with:
# - browser_specific_settings validation
# - data_collection_permissions
# - Firefox-optimized manifest
```

### Example 4: Validate Manifest for Both Stores
```bash
# Check manifest for Chrome Web Store compatibility
extension-publisher validate-manifest --store chrome

# Check manifest for Firefox Add-ons compatibility
extension-publisher validate-manifest --store firefox

# Check both stores
extension-publisher validate-manifest --store both

# Output shows:
# - Required fields status
# - Permission warnings
# - Compatibility issues
# - Specific recommendations
```

### Example 5: Generate Store Listing Documents
```bash
# Create comprehensive store listing
extension-publisher create-listing \
  --store chrome \
  --name "My Extension" \
  --description-short "Short description" \
  --category productivity

# Creates:
# - docs/chrome-store-listing.md
# - docs/permission-justifications.md
# - docs/screenshot-captions.md
```

### Example 6: Pre-submission Validation
```bash
# Run complete pre-submission check
extension-publisher pre-submit-check

# Validates:
# ✓ Manifest.json is valid for both stores
# ✓ All required icons present
# ✓ Screenshots meet dimension requirements
# ✓ Privacy policy is accessible
# ✓ Permission justifications prepared
# ✓ Package is clean and ready

# Highlights any issues that need fixing before submission
```

### Example 7: Get Submission Instructions
```bash
# Get Chrome Web Store submission guide
extension-publisher submit-guide --store chrome

# Get Firefox Add-ons submission guide
extension-publisher submit-guide --store firefox

# Opens browser with submission dashboard and provides step-by-step instructions
```

## Workflows

### Workflow 1: Complete Publishing Process

**Trigger**: User wants to publish a new extension

**Steps**:
1. Analyze current project structure
2. Validate manifest.json for both Chrome and Firefox
3. Check all required assets (icons, screenshots)
4. Validate privacy policy URL and content
5. Generate any missing assets
6. Create store listing documents
7. Package extension for submission
8. Run pre-submission checklist
9. Provide submission instructions

**Expected Output**: Ready-to-submit package with complete documentation

### Workflow 2: Manifest Validation & Fix

**Trigger**: User has manifest validation errors

**Steps**:
1. Parse manifest.json
2. Check against Chrome Web Store requirements
3. Check against Firefox Add-ons requirements
4. Identify specific errors and warnings
5. Provide actionable fixes
6. Auto-fix common issues if requested
7. Re-validate after fixes

**Expected Output**: Clean manifest with no validation errors

### Workflow 3: Asset Generation

**Trigger**: User needs missing icons or screenshots

**Steps**:
1. Check existing assets
2. Identify missing sizes/formats
3. Generate from source files if available
4. Validate generated assets
5. Organize by size and use case
6. Update manifest references if needed

**Expected Output**: Complete set of validated assets

### Workflow 4: Store Submission Package

**Trigger**: User needs submission-ready package

**Steps**:
1. Validate all prerequisites
2. Create clean .zip without dev files
3. Generate store listing documents
4. Create permission justifications
5. Generate screenshot captions
6. Create submission checklist
7. Verify package contents

**Expected Output**: Clean package + complete documentation

### Workflow 5: Pre-submission Validation

**Trigger**: User wants to ensure everything is ready

**Steps**:
1. Run comprehensive validation
2. Check manifest completeness
3. Validate all assets
4. Check privacy policy accessibility
5. Verify permission justifications
6. Validate package integrity
7. Highlight any blockers
8. Provide submission readiness score

**Expected Output**: Detailed report with submission readiness status

## Tool Configuration

The skill uses these tools:

- **Bash**: For file operations, validation, and packaging
- **Glob**: For finding assets and project files
- **Read**: For reading manifest and documentation
- **Write**: For creating store listings and packages
- **WebSearch**: For latest store requirements and policies
- **mcp__web-reader__webReader**: For reading store documentation

## Common Validation Issues

### Chrome Web Store Common Issues

1. **Missing privacy policy**
   - Error: "Privacy policy URL is required"
   - Fix: Add privacy policy URL to manifest or provide during submission

2. **Permission justification missing**
   - Error: "Please explain why you need this permission"
   - Fix: Prepare detailed permission justifications

3. **Screenshot dimensions wrong**
   - Error: "Screenshots must be 1280x800 or 640x400"
   - Fix: Generate screenshots in correct dimensions

4. **Manifest validation errors**
   - Error: "Invalid manifest.json"
   - Fix: Run manifest validation and fix reported issues

### Firefox Add-ons Common Issues

1. **Missing browser_specific_settings**
   - Error: "Add-on ID required"
   - Fix: Add browser_specific_settings.gecko.id to manifest

2. **Data collection not declared**
   - Error: "data_collection_permissions required"
   - Fix: Add data_collection_permissions declaration

3. **Code quality issues**
   - Error: "Code quality concerns"
   - Fix: Review code, remove console.logs, improve structure

4. **Permission excessive**
   - Error: "Requesting excessive permissions"
   - Fix: Review and minimize permissions, provide justification

## Store Requirements Reference

### Chrome Web Store Requirements

- **Manifest Version**: 3
- **Icons**: 16, 32, 48, 96, 128px (PNG)
- **Screenshots**: At least one, 1280x800 or 640x400
- **Privacy Policy**: Required URL
- **Permission Justifications**: Required for each permission
- **Category**: Required (Productivity, Shopping, etc.)
- **Short Description**: Max 132 characters
- **Long Description**: Max 16,000 characters
- **Developer Contact**: Email required

### Firefox Add-ons Requirements

- **Manifest Version**: 2 or 3
- **Icons**: 16, 32, 48, 96, 128px (PNG)
- **Screenshots**: At least one, 1280x720 or larger
- **Privacy Policy**: Required if collecting data
- **Add-on ID**: Required in browser_specific_settings
- **Data Collection**: Must be declared
- **Minimum Version**: strict_min_version recommended
- **Review Process**: Manual code review (3-5 days)

## Integration with Extension Projects

This skill works with any browser extension project structure:

```
extension-project/
├── manifest.json          # Main manifest file
├── icons/                 # Extension icons
│   ├── icon-16.png
│   ├── icon-32.png
│   ├── icon-48.png
│   ├── icon-96.png
│   └── icon-128.png
├── screenshots/          # Store screenshots
│   ├── screenshot-1.png (1280x800)
│   ├── screenshot-2.png (1280x800)
│   └── screenshot-3.png (640x400)
├── popup.html/js/css     # Extension UI
├── background.js         # Service worker
├── content.js            # Content scripts
└── docs/                 # Generated documentation
    ├── store-listing.md
    ├── permission-justifications.md
    └── submission-checklist.md
```

## Error Handling

The skill provides helpful error messages for:

- Missing manifest.json
- Invalid manifest format
- Missing required icons
- Incorrect screenshot dimensions
- Missing privacy policy
- Package creation failures
- File permission issues
- Invalid URLs

## Best Practices

1. **Always validate manifest** before generating assets
2. **Keep source SVG** for icons to enable easy regeneration
3. **Test extension** in both browsers before submission
4. **Host privacy policy** before starting submission
5. **Prepare screenshots** that show actual usage
6. **Write clear permission justifications** for each permission
7. **Test package** by loading as unpacked extension
8. **Keep version numbers** consistent across manifest and package

## Limitations

- Does not automatically submit to stores (manual process required)
- Cannot create developer accounts (user must do this)
- Does not handle payment processing for Chrome Web Store
- Cannot modify hosted privacy policy (user must update)
- Screenshot generation requires manual content creation

## Future Enhancements

Potential additions:
- Automated screenshot capture from extension
- A/B testing for store listings
- Review monitoring and analytics
- Automated version updates
- Multi-language support for listings
- Store API integration for status checks
