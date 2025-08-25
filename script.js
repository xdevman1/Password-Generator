class PasswordGenerator {
  constructor() {
    this.initializeElements()
    this.bindEvents()
    this.passwordHistory = JSON.parse(localStorage.getItem("passwordHistory")) || []
    this.updateHistoryDisplay()
    this.updateLengthDisplay()
  }

  initializeElements() {
    this.lengthSlider = document.getElementById("lengthSlider")
    this.lengthDisplay = document.getElementById("lengthDisplay")
    this.uppercaseCheck = document.getElementById("uppercase")
    this.lowercaseCheck = document.getElementById("lowercase")
    this.numbersCheck = document.getElementById("numbers")
    this.symbolsCheck = document.getElementById("symbols")
    this.excludeSimilarCheck = document.getElementById("excludeSimilar")
    this.passwordOutput = document.getElementById("passwordOutput")
    this.generateBtn = document.getElementById("generateBtn")
    this.copyBtn = document.getElementById("copyBtn")
    this.strengthFill = document.getElementById("strengthFill")
    this.strengthText = document.getElementById("strengthText")
    this.passwordHistoryElement = document.getElementById("passwordHistory")
    this.clearHistoryBtn = document.getElementById("clearHistory")
    this.downloadBtn = document.getElementById("downloadBtn")
    this.notification = document.getElementById("notification")
  }

  bindEvents() {
    this.lengthSlider.addEventListener("input", () => {
      this.updateLengthDisplay()
    })

    this.generateBtn.addEventListener("click", () => {
      this.generatePassword()
    })

    this.copyBtn.addEventListener("click", () => {
      this.copyToClipboard(this.passwordOutput.value)
    })

    this.clearHistoryBtn.addEventListener("click", () => {
      this.clearHistory()
    })

    this.downloadBtn.addEventListener("click", () => {
      this.downloadPasswords()
    })
    ;[this.uppercaseCheck, this.lowercaseCheck, this.numbersCheck, this.symbolsCheck, this.excludeSimilarCheck].forEach(
      (checkbox) => {
        checkbox.addEventListener("change", () => {
          if (this.passwordOutput.value) {
            this.updateStrengthIndicator(this.passwordOutput.value)
          }
        })
      },
    )

    document.addEventListener("keydown", (e) => {
      if (e.key === "Enter" || e.key === " ") {
        if (e.target === this.generateBtn) {
          this.generatePassword()
        }
      }
    })
  }

  updateLengthDisplay() {
    const length = this.lengthSlider.value
    const min = Math.max(4, length - 16)
    const max = Math.min(50, Number.parseInt(length) + 16)
    this.lengthDisplay.value = `${min}-${max}`
  }

  generatePassword() {
    const length = Number.parseInt(this.lengthSlider.value)
    let charset = ""

    const uppercase = "ABCDEFGHIJKLMNOPQRSTUVWXYZ"
    const lowercase = "abcdefghijklmnopqrstuvwxyz"
    const numbers = "0123456789"
    const symbols = "!@#$%^&*()_+-=[]{}|;:,.<>?"

    const similarChars = "0O1lI"

    if (this.uppercaseCheck.checked) {
      charset += this.excludeSimilarCheck.checked
        ? uppercase
            .split("")
            .filter((char) => !similarChars.includes(char))
            .join("")
        : uppercase
    }

    if (this.lowercaseCheck.checked) {
      charset += this.excludeSimilarCheck.checked
        ? lowercase
            .split("")
            .filter((char) => !similarChars.includes(char))
            .join("")
        : lowercase
    }

    if (this.numbersCheck.checked) {
      charset += this.excludeSimilarCheck.checked
        ? numbers
            .split("")
            .filter((char) => !similarChars.includes(char))
            .join("")
        : numbers
    }

    if (this.symbolsCheck.checked) {
      charset += symbols
    }

    if (!charset) {
      this.showNotification("Please select at least one character type!", "error")
      return
    }

    let password = ""
    const array = new Uint8Array(length)
    crypto.getRandomValues(array)

    for (let i = 0; i < length; i++) {
      password += charset[array[i] % charset.length]
    }

    this.passwordOutput.value = password
    this.updateStrengthIndicator(password)
    this.addToHistory(password)
    this.animateGeneration()
  }

  updateStrengthIndicator(password) {
    let score = 0
    let feedback = ""

    if (password.length >= 8) score += 1
    if (password.length >= 12) score += 1
    if (/[a-z]/.test(password)) score += 1
    if (/[A-Z]/.test(password)) score += 1
    if (/[0-9]/.test(password)) score += 1
    if (/[^A-Za-z0-9]/.test(password)) score += 1
    if (password.length >= 16) score += 1

    this.strengthFill.className = "strength-fill"

    if (score <= 2) {
      this.strengthFill.classList.add("weak")
      feedback = "Weak Password"
    } else if (score <= 4) {
      this.strengthFill.classList.add("fair")
      feedback = "Fair Password"
    } else if (score <= 5) {
      this.strengthFill.classList.add("good")
      feedback = "Good Password"
    } else {
      this.strengthFill.classList.add("strong")
      feedback = "Strong Password"
    }

    this.strengthText.textContent = feedback
  }

  addToHistory(password) {
    if (this.passwordHistory.includes(password)) return

    this.passwordHistory.unshift(password)
    if (this.passwordHistory.length > 10) {
      this.passwordHistory.pop()
    }

    localStorage.setItem("passwordHistory", JSON.stringify(this.passwordHistory))
    this.updateHistoryDisplay()
  }

  updateHistoryDisplay() {
    this.passwordHistoryElement.innerHTML = ""

    this.passwordHistory.forEach((password) => {
      const historyItem = document.createElement("div")
      historyItem.className = "history-item"
      historyItem.innerHTML = `
                <span>${password.substring(0, 20)}${password.length > 20 ? "..." : ""}</span>
                <button class="btn-ghost p-2" title="Copy this password">
                    <i class="fas fa-copy"></i>
                </button>
            `

      historyItem.querySelector("button").addEventListener("click", (e) => {
        e.stopPropagation()
        this.copyToClipboard(password)
      })

      historyItem.addEventListener("click", () => {
        this.passwordOutput.value = password
        this.updateStrengthIndicator(password)
      })

      this.passwordHistoryElement.appendChild(historyItem)
    })
  }

  clearHistory() {
    this.passwordHistory = []
    localStorage.removeItem("passwordHistory")
    this.updateHistoryDisplay()
    this.showNotification("History cleared!", "success")
  }

  downloadPasswords() {
    if (this.passwordHistory.length === 0) {
      this.showNotification("No passwords to download!", "error")
      return
    }

    const content = this.passwordHistory.join("\n")
    const blob = new Blob([content], { type: "text/plain" })
    const url = window.URL.createObjectURL(blob)
    const a = document.createElement("a")
    a.href = url
    a.download = `passwords_${new Date().toISOString().split("T")[0]}.txt`
    document.body.appendChild(a)
    a.click()
    document.body.removeChild(a)
    window.URL.revokeObjectURL(url)

    this.showNotification("Passwords downloaded!", "success")
  }

  async copyToClipboard(text) {
    if (!text) {
      this.showNotification("No password to copy!", "error")
      return
    }

    try {
      await navigator.clipboard.writeText(text)
      this.showNotification("Password copied to clipboard!", "success")
    } catch (err) {
      const textArea = document.createElement("textarea")
      textArea.value = text
      document.body.appendChild(textArea)
      textArea.select()
      document.execCommand("copy")
      document.body.removeChild(textArea)
      this.showNotification("Password copied to clipboard!", "success")
    }
  }

  showNotification(message, type = "success") {
    this.notification.querySelector("span").textContent = message
    this.notification.className = `notification ${type}`
    this.notification.classList.add("show")

    setTimeout(() => {
      this.notification.classList.remove("show")
    }, 3000)
  }

  animateGeneration() {
    this.generateBtn.style.transform = "scale(0.95)"
    setTimeout(() => {
      this.generateBtn.style.transform = "scale(1)"
    }, 150)

    const icon = this.generateBtn.querySelector("i")
    icon.style.animation = "spin 0.5s linear"
    setTimeout(() => {
      icon.style.animation = ""
    }, 500)
  }
}

document.addEventListener("DOMContentLoaded", () => {
  new PasswordGenerator()
})

const style = document.createElement("style")
style.textContent = `
    @keyframes spin {
        from { transform: rotate(0deg); }
        to { transform: rotate(360deg); }
    }
`
document.head.appendChild(style)
