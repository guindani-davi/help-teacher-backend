UPDATE subscription_plans
SET name = REPLACE(name, 'Help Tutor', 'Help Teacher'),
    asaas_description = REPLACE(asaas_description, 'Help Tutor', 'Help Teacher');
