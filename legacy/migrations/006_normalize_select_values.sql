UPDATE beneficiaries SET escolaridade = CASE lower(escolaridade)
    WHEN 'sem escolaridade' THEN 'SEM_ESCOLARIDADE'
    WHEN 'fundamental incompleto' THEN 'FUNDAMENTAL_INCOMPLETO'
    WHEN 'ensino fundamental incompleto' THEN 'FUNDAMENTAL_INCOMPLETO'
    WHEN 'fundamental completo' THEN 'FUNDAMENTAL_COMPLETO'
    WHEN 'ensino fundamental completo' THEN 'FUNDAMENTAL_COMPLETO'
    WHEN 'medio incompleto' THEN 'MEDIO_INCOMPLETO'
    WHEN 'médio incompleto' THEN 'MEDIO_INCOMPLETO'
    WHEN 'medio completo' THEN 'MEDIO_COMPLETO'
    WHEN 'médio completo' THEN 'MEDIO_COMPLETO'
    WHEN 'superior incompleto' THEN 'SUPERIOR_INCOMPLETO'
    WHEN 'superior completo' THEN 'SUPERIOR_COMPLETO'
    WHEN 'pos-graduacao' THEN 'POS_GRADUACAO'
    WHEN 'pós-graduação' THEN 'POS_GRADUACAO'
    ELSE escolaridade END;

UPDATE properties SET forma_ocupacao = CASE lower(forma_ocupacao)
    WHEN 'própria' THEN 'PROPRIA' WHEN 'propria' THEN 'PROPRIA'
    WHEN 'arrendada' THEN 'ARRENDADA' WHEN 'posse' THEN 'POSSE'
    ELSE forma_ocupacao END;

UPDATE properties SET documento_existente = 'TITULO_DEFINITIVO'
WHERE lower(documento_existente) IN ('título', 'titulo');

UPDATE patrimony_items SET unidade = CASE lower(unidade)
    WHEN 'ha' THEN 'HECTARE' WHEN 'hectare' THEN 'HECTARE'
    WHEN 'un' THEN 'UNIDADE' WHEN 'und' THEN 'UNIDADE'
    WHEN 'kg' THEN 'QUILOGRAMA' WHEN 't' THEN 'TONELADA'
    WHEN 'l' THEN 'LITRO' WHEN 'ano' THEN 'ANO' WHEN 'mes' THEN 'MES'
    ELSE unidade END;

UPDATE cash_flow_items SET unidade = CASE lower(unidade)
    WHEN 'ha' THEN 'HECTARE' WHEN 'hectare' THEN 'HECTARE'
    WHEN 'un' THEN 'UNIDADE' WHEN 'und' THEN 'UNIDADE'
    WHEN 'kg' THEN 'QUILOGRAMA' WHEN 't' THEN 'TONELADA'
    WHEN 'l' THEN 'LITRO' WHEN 'ano' THEN 'ANO' WHEN 'mes' THEN 'MES'
    ELSE unidade END;

UPDATE proposal_use_sources SET categoria = 'INVESTIMENTO_FIXO'
WHERE lower(categoria) IN ('equipamentos', 'investimento fixo');
