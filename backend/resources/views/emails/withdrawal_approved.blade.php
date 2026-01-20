<!DOCTYPE html>
<html lang="en">
<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <title>Withdrawal Approved</title>
    <style>
        body {
            font-family: Arial, sans-serif;
            line-height: 1.6;
            color: #333;
            background-color: #f4f4f4;
            margin: 0;
            padding: 0;
        }
        .container {
            max-width: 600px;
            margin: 20px auto;
            background-color: #fff;
            padding: 20px;
            border-radius: 8px;
            box-shadow: 0 2px 4px rgba(0,0,0,0.1);
        }
        .header {
            background-color: #007bff;
            color: #fff;
            padding: 20px;
            border-radius: 4px 4px 0 0;
            text-align: center;
        }
        .content {
            padding: 20px;
        }
        .details {
            background-color: #f9f9f9;
            padding: 15px;
            border-left: 4px solid #28a745;
            margin: 20px 0;
        }
        .detail-row {
            display: flex;
            justify-content: space-between;
            padding: 8px 0;
            border-bottom: 1px solid #eee;
        }
        .detail-row:last-child {
            border-bottom: none;
        }
        .label {
            font-weight: bold;
            color: #555;
        }
        .value {
            color: #333;
        }
        .footer {
            text-align: center;
            padding: 20px;
            color: #666;
            font-size: 12px;
            border-top: 1px solid #eee;
            margin-top: 20px;
        }
        .success-badge {
            display: inline-block;
            background-color: #28a745;
            color: #fff;
            padding: 8px 16px;
            border-radius: 4px;
            margin: 10px 0;
        }
    </style>
</head>
<body>
    <div class="container">
        <div class="header">
            <h2>Withdrawal Approved ✓</h2>
        </div>
        <div class="content">
            <p>Hi {{ $userName }},</p>
            
            <p>Good news! Your withdrawal request has been approved and is being processed.</p>
            
            <div class="success-badge">Status: Approved</div>
            
            <div class="details">
                <div class="detail-row">
                    <span class="label">Amount:</span>
                    <span class="value">₦{{ $amount }}</span>
                </div>
                <div class="detail-row">
                    <span class="label">Bank Details:</span>
                    <span class="value">{{ $bankDetails }}</span>
                </div>
                <div class="detail-row">
                    <span class="label">Status:</span>
                    <span class="value">Approved</span>
                </div>
                <div class="detail-row">
                    <span class="label">Approved Date:</span>
                    <span class="value">{{ $withdrawal->approved_at?->format('M d, Y H:i A') }}</span>
                </div>
            </div>
            
            <p>The funds will be transferred to your account within 1-3 business days. You can track the status of your withdrawal in your dashboard.</p>
            
            <p>If you have any questions, please contact our support team.</p>
            
            <p>Best regards,<br>AffiliateHub Team</p>
        </div>
        <div class="footer">
            <p>© 2026 AffiliateHub. All rights reserved.</p>
        </div>
    </div>
</body>
</html>
