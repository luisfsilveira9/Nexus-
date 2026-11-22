import math
from decimal import Decimal, ROUND_FLOOR, ROUND_CEILING
UN=[(15,None),(12,'tri'),(9,'bi'),(6,'mi'),(3,'mil')]
def fmt(v, modo='baixo'):
    """RN-017 v0.2. modo: baixo (ouro, renda, poder, ganho) | cima (custo, faltam)"""
    d=Decimal(repr(float(v))); R=ROUND_FLOOR if modo=='baixo' else ROUND_CEILING
    if d<100:
        q=d.quantize(Decimal('0.1'),rounding=R)
        if q<100:
            s=format(q,'f')
            if s.endswith('.0'): s=s[:-2]
            return s.replace('.',',')
        d=Decimal(100)
    if d<1000:
        q=d.quantize(Decimal('1'),rounding=R)
        if q<1000: return str(int(q))
        d=Decimal(1000)
    e=d.adjusted()
    if e>=15:
        m=(d/Decimal(10)**e).quantize(Decimal('0.01'),rounding=R)
        if m>=10: m=Decimal('1.00'); e+=1
        return f"{m:.2f}".replace('.',',')+f"e{e}"
    k=(e//3)*3; un=dict(UN)[k]
    m=d/Decimal(10)**k; casas=2-(m.adjusted())
    q=m.quantize(Decimal(1).scaleb(-casas),rounding=R)
    if q>=1000:
        return fmt(Decimal(10)**(k+3),modo)
    return format(q,'f').replace('.',',')+' '+un
def pct(p): return f"{math.floor(p*100+0.5)}%"
def chance(pt,pr):
    x=pt/pr-1; p=1/(1+math.exp(-6*x)); return min(.95,max(.05,p))
def custo(base,n,k=1): return base*1.15**n*(1.15**k-1)/0.15 if k>1 else base*1.15**n
