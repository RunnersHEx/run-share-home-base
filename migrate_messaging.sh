#!/bin/bash

# =====================================================
# MESSAGING SYSTEM MIGRATION SCRIPT
# =====================================================
# This script helps migrate from the old messaging system to the new fixed one

echo "🔧 Messaging System Migration Script"
echo "====================================="

# Colors for output
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
NC='\033[0m' # No Color

# Function to print colored output
print_status() {
    echo -e "${BLUE}[INFO]${NC} $1"
}

print_success() {
    echo -e "${GREEN}[SUCCESS]${NC} $1"
}

print_warning() {
    echo -e "${YELLOW}[WARNING]${NC} $1"
}

print_error() {
    echo -e "${RED}[ERROR]${NC} $1"
}

# Check if we're in the right directory
if [ ! -f "package.json" ]; then
    print_error "This script must be run from the project root directory"
    exit 1
fi

if [ ! -d "src/hooks" ]; then
    print_error "src/hooks directory not found. Are you in the right project?"
    exit 1
fi

print_status "Starting messaging system migration..."

# Step 1: Backup original files
print_status "Step 1: Backing up original messaging files..."

BACKUP_DIR="backup_messaging_$(date +%Y%m%d_%H%M%S)"
mkdir -p "$BACKUP_DIR"

# Backup original files if they exist
files_to_backup=(
    "src/hooks/useMessaging.ts"
    "src/components/messaging/ChatInterface.tsx"
    "src/components/messaging/ConversationList.tsx"
    "src/components/messaging/MessagingPage.tsx"
    "src/components/messaging/MessagingModal.tsx"
    "src/components/messaging/UnreadBadge.tsx"
    "src/services/messagingService.ts"
)

for file in "${files_to_backup[@]}"; do
    if [ -f "$file" ]; then
        cp "$file" "$BACKUP_DIR/"
        print_success "Backed up $file"
    else
        print_warning "$file not found - skipping backup"
    fi
done

# Step 2: Replace with fixed versions
print_status "Step 2: Installing fixed messaging system..."

# Move fixed files to their final locations
fixed_files=(
    "src/hooks/useMessagingFixed.ts:src/hooks/useMessaging.ts"
    "src/components/messaging/ChatInterfaceFixed.tsx:src/components/messaging/ChatInterface.tsx"
    "src/components/messaging/ConversationListFixed.tsx:src/components/messaging/ConversationList.tsx"
    "src/components/messaging/MessagingPageFixed.tsx:src/components/messaging/MessagingPage.tsx"
    "src/components/messaging/MessagingModalFixed.tsx:src/components/messaging/MessagingModal.tsx"
    "src/components/messaging/UnreadBadgeFixed.tsx:src/components/messaging/UnreadBadge.tsx"
)

for mapping in "${fixed_files[@]}"; do
    IFS=':' read -r source dest <<< "$mapping"
    if [ -f "$source" ]; then
        cp "$source" "$dest"
        print_success "Installed $dest"
    else
        print_error "$source not found!"
    fi
done

# Step 3: Update imports in key files
print_status "Step 3: Updating imports in common files..."

# Files that commonly import messaging components
common_files=(
    "src/App.tsx"
    "src/pages/*.tsx"
    "src/components/layout/MainHeader.tsx"
    "src/components/layout/Navbar.tsx"
)

print_warning "Manual step required: Please update imports in your routing and navigation files"
print_warning "Replace 'useMessagingFixed' with 'useMessaging' in import statements"

# Step 4: Clean up temporary fixed files
print_status "Step 4: Cleaning up temporary files..."

for mapping in "${fixed_files[@]}"; do
    IFS=':' read -r source dest <<< "$mapping"
    if [ -f "$source" ]; then
        rm "$source"
        print_success "Removed temporary file $source"
    fi
done

# Step 5: Update package.json scripts if needed
print_status "Step 5: Checking for any needed updates..."

# Check if there are any TypeScript errors
if command -v npm &> /dev/null; then
    print_status "Running TypeScript check..."
    if npm run type-check 2>/dev/null; then
        print_success "TypeScript check passed"
    else
        print_warning "TypeScript check failed - you may need to update some imports manually"
    fi
fi

# Final summary
echo ""
echo "========================================="
echo "🎉 Migration Complete!"
echo "========================================="
echo ""
print_success "Messaging system has been upgraded to the fixed version"
print_status "Backup created in: $BACKUP_DIR"
echo ""
echo "📋 Next Steps:"
echo "1. Update any remaining import statements in your codebase"
echo "2. Test the messaging system thoroughly"
echo "3. Remove backup files once you're satisfied with the upgrade"
echo ""
echo "🧪 Test the system by:"
echo "- Opening the /messages page"
echo "- Sending messages between users"
echo "- Testing real-time updates with multiple browser windows"
echo ""
print_status "If you encounter any issues, restore from the backup in $BACKUP_DIR"

# Create a rollback script
cat > rollback_messaging.sh << 'EOF'
#!/bin/bash
# Rollback script for messaging system migration

BACKUP_DIR=$1

if [ -z "$BACKUP_DIR" ]; then
    echo "Usage: ./rollback_messaging.sh <backup_directory>"
    exit 1
fi

if [ ! -d "$BACKUP_DIR" ]; then
    echo "Backup directory $BACKUP_DIR not found"
    exit 1
fi

echo "Rolling back messaging system from $BACKUP_DIR..."

# Restore original files
for file in "$BACKUP_DIR"/*; do
    filename=$(basename "$file")
    dest="src/hooks/$filename"
    if [[ "$filename" == *"messaging"* ]]; then
        dest="src/components/messaging/$filename"
    fi
    if [[ "$filename" == *"Service"* ]]; then
        dest="src/services/$filename"
    fi
    
    cp "$file" "$dest"
    echo "Restored $dest"
done

echo "Rollback complete!"
EOF

chmod +x rollback_messaging.sh
print_success "Created rollback script: ./rollback_messaging.sh $BACKUP_DIR"

echo ""
print_success "Migration script completed successfully!"
