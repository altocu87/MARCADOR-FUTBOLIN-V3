-- Owner approved rewards, cumulative ceil curve 0..100, and all valid history
-- on 2026-10-02 in block 02. Activation changes only server configuration.
update public.xp_rules_v1 set enabled=true where singleton and version=1;
