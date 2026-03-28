UPDATE subscription_plans
SET name = REPLACE(name, 'Help Teacher ', ''),
    asaas_description = REPLACE(asaas_description, 'Help Teacher ', '');
