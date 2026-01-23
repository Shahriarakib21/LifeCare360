import os
import re

def clean_merge_conflicts(file_path):
    """Remove merge conflict markers from a file, keeping HEAD version."""
    try:
        with open(file_path, 'r', encoding='utf-8') as f:
            content = f.read()
        
        # Check if file has conflict markers
        if '<<<<<<< HEAD' not in content:
            return False
        
        # Pattern to match conflict blocks
        # <<<<<<< HEAD\n(content)\n=======\n(other content)\n>>>>>>> hash
        pattern = r'<<<<<<< HEAD\r?\n(.*?)\r?\n=======\r?\n.*?\r?\n>>>>>>> [^\r\n]+\r?\n?'
        
        # Replace with just the HEAD content
        cleaned = re.sub(pattern, r'\1\n', content, flags=re.DOTALL)
        
        # Write back
        with open(file_path, 'w', encoding='utf-8') as f:
            f.write(cleaned)
        
        print(f"✓ Cleaned: {file_path}")
        return True
    except Exception as e:
        print(f"✗ Error processing {file_path}: {e}")
        return False

def main():
    src_dir = r'c:\Users\HP\Downloads\intern\intern\frontend\src'
    
    cleaned_count = 0
    for root, dirs, files in os.walk(src_dir):
        for file in files:
            if file.endswith(('.ts', '.tsx')):
                file_path = os.path.join(root, file)
                if clean_merge_conflicts(file_path):
                    cleaned_count += 1
    
    print(f"\n✓ Cleaned {cleaned_count} files")

if __name__ == '__main__':
    main()
