

import razorpayX from "../config/razorpayx.js";
import User from "../models/User.js";

// Add bank account (multiple accounts supported)
export const addBankAccount = async (req, res) => {
  try {
    const { accountHolderName, accountNumber, ifscCode, bankName, branchName, accountType, isPrimary } = req.body;

    // Validate required fields
    if (!accountHolderName || !accountNumber || !ifscCode) {
      return res.status(400).json({ message: "Account holder name, account number, and IFSC code are required" });
    }

    const user = await User.findById(req.user.id);

    if (!user) {
      return res.status(404).json({ message: "User not found" });
    }

    // Check if account number already exists
    const accountExists = user.bankAccounts.some(acc => acc.accountNumber === accountNumber);
    if (accountExists) {
      return res.status(400).json({ message: "This account number is already added" });
    }

    // If this is the first account or isPrimary is true, make it primary
    const shouldBePrimary = user.bankAccounts.length === 0 || isPrimary === true;

    // If setting as primary, unset other primary accounts
    if (shouldBePrimary) {
      user.bankAccounts.forEach(acc => {
        acc.isPrimary = false;
      });
    }

    // 1️⃣ Create contact in RazorpayX
    const contact = await razorpayX.contacts.create({
      name: accountHolderName,
      email: user.email,
      type: user.role === 'admin' ? 'self' : 'vendor',
      reference_id: `${user._id.toString()}_${Date.now()}`,
    });

    // 2️⃣ Create fund account in RazorpayX
    const fundAccount = await razorpayX.fundAccounts.create({
      contact_id: contact.id,
      account_type: "bank_account",
      bank_account: {
        name: accountHolderName,
        ifsc: ifscCode,
        account_number: accountNumber,
      },
    });

    // 3️⃣ Add bank account to user's accounts array
    user.bankAccounts.push({
      accountHolderName,
      accountNumber,
      ifscCode,
      bankName: bankName || '',
      branchName: branchName || '',
      accountType: accountType || 'savings',
      isPrimary: shouldBePrimary,
      isVerified: true,
      razorpayContactId: contact.id,
      razorpayFundAccountId: fundAccount.id,
    });
    
    await user.save();

    // Get the newly added account
    const newAccount = user.bankAccounts[user.bankAccounts.length - 1];

    res.json({ 
      message: "Bank account added successfully",
      bankAccount: {
        id: newAccount._id,
        accountHolderName: newAccount.accountHolderName,
        accountNumber: '****' + newAccount.accountNumber.slice(-4),
        ifscCode: newAccount.ifscCode,
        bankName: newAccount.bankName,
        branchName: newAccount.branchName,
        accountType: newAccount.accountType,
        isPrimary: newAccount.isPrimary,
        isVerified: newAccount.isVerified,
        createdAt: newAccount.createdAt,
      }
    });
  } catch (error) {
    console.error("Error adding bank account:", error);
    res.status(500).json({ 
      message: "Failed to add bank account", 
      error: error.message 
    });
  }
};

// Get all bank accounts
export const getBankAccounts = async (req, res) => {
  try {
    const user = await User.findById(req.user.id).select('bankAccounts');

    if (!user || !user.bankAccounts || user.bankAccounts.length === 0) {
      return res.json({ bankAccounts: [] });
    }

    // Return accounts with masked account numbers
    const accounts = user.bankAccounts.map(acc => ({
      id: acc._id,
      accountHolderName: acc.accountHolderName,
      accountNumber: '****' + acc.accountNumber.slice(-4),
      ifscCode: acc.ifscCode,
      bankName: acc.bankName,
      branchName: acc.branchName,
      accountType: acc.accountType,
      isPrimary: acc.isPrimary,
      isVerified: acc.isVerified,
      createdAt: acc.createdAt,
    }));

    res.json({ bankAccounts: accounts });
  } catch (error) {
    console.error("Error fetching bank accounts:", error);
    res.status(500).json({ message: "Failed to fetch bank accounts" });
  }
};

// Get primary bank account
export const getPrimaryBankAccount = async (req, res) => {
  try {
    const user = await User.findById(req.user.id).select('bankAccounts');

    if (!user || !user.bankAccounts || user.bankAccounts.length === 0) {
      return res.status(404).json({ message: "No bank accounts found" });
    }

    const primaryAccount = user.bankAccounts.find(acc => acc.isPrimary);

    if (!primaryAccount) {
      return res.status(404).json({ message: "No primary account set" });
    }

    res.json({
      id: primaryAccount._id,
      accountHolderName: primaryAccount.accountHolderName,
      accountNumber: '****' + primaryAccount.accountNumber.slice(-4),
      ifscCode: primaryAccount.ifscCode,
      bankName: primaryAccount.bankName,
      branchName: primaryAccount.branchName,
      accountType: primaryAccount.accountType,
      isPrimary: primaryAccount.isPrimary,
      isVerified: primaryAccount.isVerified,
      razorpayFundAccountId: primaryAccount.razorpayFundAccountId,
    });
  } catch (error) {
    console.error("Error fetching primary bank account:", error);
    res.status(500).json({ message: "Failed to fetch primary bank account" });
  }
};

// Set account as primary
export const setPrimaryAccount = async (req, res) => {
  try {
    const { accountId } = req.params;
    const user = await User.findById(req.user.id);

    if (!user) {
      return res.status(404).json({ message: "User not found" });
    }

    const account = user.bankAccounts.id(accountId);

    if (!account) {
      return res.status(404).json({ message: "Bank account not found" });
    }

    // Unset all primary accounts
    user.bankAccounts.forEach(acc => {
      acc.isPrimary = false;
    });

    // Set this account as primary
    account.isPrimary = true;

    await user.save();

    res.json({ 
      message: "Primary account updated successfully",
      bankAccount: {
        id: account._id,
        accountHolderName: account.accountHolderName,
        accountNumber: '****' + account.accountNumber.slice(-4),
        isPrimary: account.isPrimary,
      }
    });
  } catch (error) {
    console.error("Error setting primary account:", error);
    res.status(500).json({ message: "Failed to set primary account" });
  }
};

// Update bank account
export const updateBankAccount = async (req, res) => {
  try {
    const { accountId } = req.params;
    const { accountHolderName, accountNumber, ifscCode, bankName, branchName, accountType } = req.body;
    
    const user = await User.findById(req.user.id);

    if (!user) {
      return res.status(404).json({ message: "User not found" });
    }

    const account = user.bankAccounts.id(accountId);

    if (!account) {
      return res.status(404).json({ message: "Bank account not found" });
    }

    // Check if updating to an account number that already exists (in another account)
    if (accountNumber && accountNumber !== account.accountNumber) {
      const accountExists = user.bankAccounts.some(acc => 
        acc.accountNumber === accountNumber && acc._id.toString() !== accountId
      );
      if (accountExists) {
        return res.status(400).json({ message: "This account number is already added" });
      }
    }

    // If changing critical bank details, recreate RazorpayX fund account
    const criticalFieldsChanged = 
      (accountNumber && accountNumber !== account.accountNumber) ||
      (ifscCode && ifscCode !== account.ifscCode) ||
      (accountHolderName && accountHolderName !== account.accountHolderName);

    if (criticalFieldsChanged) {
      // Create new contact
      const contact = await razorpayX.contacts.create({
        name: accountHolderName || account.accountHolderName,
        email: user.email,
        type: user.role === 'admin' ? 'self' : 'vendor',
        reference_id: `${user._id.toString()}_${Date.now()}`,
      });

      // Create new fund account
      const fundAccount = await razorpayX.fundAccounts.create({
        contact_id: contact.id,
        account_type: "bank_account",
        bank_account: {
          name: accountHolderName || account.accountHolderName,
          ifsc: ifscCode || account.ifscCode,
          account_number: accountNumber || account.accountNumber,
        },
      });

      account.razorpayContactId = contact.id;
      account.razorpayFundAccountId = fundAccount.id;
      account.isVerified = true;
    }

    // Update fields
    if (accountHolderName) account.accountHolderName = accountHolderName;
    if (accountNumber) account.accountNumber = accountNumber;
    if (ifscCode) account.ifscCode = ifscCode;
    if (bankName !== undefined) account.bankName = bankName;
    if (branchName !== undefined) account.branchName = branchName;
    if (accountType) account.accountType = accountType;

    await user.save();

    res.json({ 
      message: "Bank account updated successfully",
      bankAccount: {
        id: account._id,
        accountHolderName: account.accountHolderName,
        accountNumber: '****' + account.accountNumber.slice(-4),
        ifscCode: account.ifscCode,
        bankName: account.bankName,
        branchName: account.branchName,
        accountType: account.accountType,
        isPrimary: account.isPrimary,
        isVerified: account.isVerified,
      }
    });
  } catch (error) {
    console.error("Error updating bank account:", error);
    res.status(500).json({ 
      message: "Failed to update bank account", 
      error: error.message 
    });
  }
};

// Delete bank account
export const deleteBankAccount = async (req, res) => {
  try {
    const { accountId } = req.params;
    const user = await User.findById(req.user.id);

    if (!user) {
      return res.status(404).json({ message: "User not found" });
    }

    const account = user.bankAccounts.id(accountId);

    if (!account) {
      return res.status(404).json({ message: "Bank account not found" });
    }

    const wasPrimary = account.isPrimary;

    // Remove the account
    user.bankAccounts.pull(accountId);

    // If deleted account was primary and there are other accounts, set first one as primary
    if (wasPrimary && user.bankAccounts.length > 0) {
      user.bankAccounts[0].isPrimary = true;
    }

    await user.save();

    res.json({ 
      message: "Bank account deleted successfully",
      remainingAccounts: user.bankAccounts.length
    });
  } catch (error) {
    console.error("Error deleting bank account:", error);
    res.status(500).json({ message: "Failed to delete bank account" });
  }
};
