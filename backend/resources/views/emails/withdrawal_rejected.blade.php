<!DOCTYPE html>
<html lang="en">
<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <title>Withdrawal Rejected</title>
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
            background-color: #dc3545;
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
            border-left: 4px solid #dc3545;
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
        .reason-box {
            background-color: #fff3cd;
            border: 1px solid #ffc107;
            padding: 15px;
            border-radius: 4px;
            margin: 20px 0;
        }
        .reason-title {
            font-weight: bold;
            color: #856404;
            margin-bottom: 10px;
        }
        .footer {
            text-align: center;
            padding: 20px;
            color: #666;
            font-size: 12px;
            border-top: 1px solid #eee;
            margin-top: 20px;
        }
    </style>
</head>
<body>
    <div class="container">
        <div class="header">
            <h2>Withdrawal Request Rejected</h2>
        </div>
        <div class="content">
            <p>Hi {{ $userName }},</p>
            
            <p>Unfortunately, your withdrawal request has been rejected. The funds have been restored to your account.</p>
            
            <div class="details">
                <div class="detail-row">
                    <span class="label">Amount:</span>
                    <span class="value">₦{{ $amount }}</span>
                </div>
                <div class="detail-row">
                    <span class="label">Status:</span>
                    <span class="value">Rejected</span>
                </div>
                <div class="detail-row">
                    <span class="label">Rejected Date:</span>
                    <span class="value">{{ $withdrawal->rejected_at?->format('M d, Y H:i A') }}</span>
                </div>
            </div>
            
            <div class="reason-box">
                <div class="reason-title">Reason for Rejection:</div>
                <p>{{ $reason }}</p>
            </div>
            
            <p>The ₦{{ $amount }} has been returned to your account balance. You can view your updated balance in your dashboard and submit a new withdrawal request if needed.</p>
            
            <p>If you believe this is an error or have questions about the rejection, please contact our support team.</p>
            
            <p>Best regards,<br>AffiliateHub Team</p>
        </div>
        <div class="footer">
            <p>© 2026 AffiliateHub. All rights reserved.</p>
        </div>
    </div>
</body>
</html>
