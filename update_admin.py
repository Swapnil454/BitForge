import sys

with open("client/app/dashboard/admin/page.tsx", "r", encoding="utf-8") as f:
    text = f.read()

text = text.replace("  const handleThemeToggle = () => {", "  const handleThemeChange = (newTheme: string) => {")
text = text.replace("const newTheme = theme === 'dark' ? 'light' : 'dark';\n    setTheme(newTheme);", "setTheme(newTheme);")
text = text.replace("const newTheme = theme === 'dark' ? 'light' : 'dark';\r\n    setTheme(newTheme);", "setTheme(newTheme);")

# Also replace the user preferences lines
text = text.replace("if (!userObj.preferences) userObj.preferences = {};", "")
text = text.replace("userObj.preferences.theme = newTheme;", "userObj.preferences = res.preferences || { theme: newTheme };")

text = text.replace("userAPI.updatePreferences({ theme: newTheme }).then(() => {", "userAPI.updatePreferences({ theme: newTheme }).then((res) => {")

old_menu1 = """                    {mounted && (
                      <MenuItem 
                        label={theme === 'dark' ? "Light Mode" : "Dark Mode"} 
                        icon={theme === 'dark' ? <Sun className="h-4 w-4" /> : <Moon className="h-4 w-4" />}
                        onClick={handleThemeToggle} 
                      />
                    )}"""
                    
new_menu1 = """                    {mounted && (
                      <div className="py-1">
                        <MenuItem 
                          label="Light Mode" 
                          icon={<Sun className="h-4 w-4" />}
                          onClick={() => handleThemeChange('light')} 
                        />
                        <MenuItem 
                          label="Dark Mode" 
                          icon={<Moon className="h-4 w-4" />}
                          onClick={() => handleThemeChange('dark')} 
                        />
                        <MenuItem 
                          label="System Theme" 
                          icon={<Monitor className="h-4 w-4" />}
                          onClick={() => handleThemeChange('system')} 
                        />
                      </div>
                    )}"""
                    
# account for \r\n or \n
text = text.replace(old_menu1, new_menu1)
text = text.replace(old_menu1.replace("\n", "\r\n"), new_menu1)

old_menu2 = """                    {mounted && (
                      <MenuItem 
                        label={theme === "dark" ? "Light Mode" : "Dark Mode"} 
                        icon={theme === "dark" ? <Sun className="h-4 w-4" /> : <Moon className="h-4 w-4" />}
                        onClick={handleThemeToggle} 
                      />
                    )}"""
text = text.replace(old_menu2, new_menu1)
text = text.replace(old_menu2.replace("\n", "\r\n"), new_menu1)

text = text.replace("const { theme, setTheme } = useTheme();", "const { theme, setTheme, resolvedTheme } = useTheme();")


with open("client/app/dashboard/admin/page.tsx", "w", encoding="utf-8") as f:
    f.write(text)

