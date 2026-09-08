<?php

namespace App\Enums;

enum Municipality: string
{
    case AltoAlegre = 'Alto Alegre';
    case Amajari = 'Amajari';
    case BoaVista = 'Boa Vista';
    case Bonfim = 'Bonfim';
    case Canta = 'Cantá';
    case Caracarai = 'Caracaraí';
    case Caroebe = 'Caroebe';
    case Iracema = 'Iracema';
    case Mucajai = 'Mucajaí';
    case Normandia = 'Normandia';
    case Pacaraima = 'Pacaraima';
    case Rorainopolis = 'Rorainópolis';
    case SaoJoaoDaBaliza = 'São João da Baliza';
    case SaoLuiz = 'São Luiz';
    case Uiramuta = 'Uiramutã';

    public function label(): string
    {
        return $this->value;
    }

    public function fiscalModuleHectares(): int
    {
        return match ($this) {
            self::AltoAlegre, self::Amajari, self::BoaVista, self::Bonfim, self::Canta, self::Normandia, self::Pacaraima, self::Uiramuta => 80,

            self::Caracarai, self::Caroebe, self::Iracema, self::Mucajai, self::Rorainopolis, self::SaoJoaoDaBaliza, self::SaoLuiz => 100,
        };
    }
}
