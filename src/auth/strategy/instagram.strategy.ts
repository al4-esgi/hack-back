import { Injectable, UnauthorizedException } from "@nestjs/common";
import { ConfigService } from "@nestjs/config";
import { PassportStrategy } from "@nestjs/passport";
import { Strategy } from "passport-instagram";
import { EnvironmentVariables } from "../../_utils/config/env.config";
import { AuthService } from "../auth.service";

@Injectable()
export class InstagramStrategy extends PassportStrategy(Strategy, "instagram") {
  constructor(
    private readonly authService: AuthService,
    private readonly configService: ConfigService<EnvironmentVariables, true>,
  ) {
    const clientId = configService.get("INSTAGRAM_CLIENT_ID");
    const clientSecret = configService.get("INSTAGRAM_CLIENT_SECRET");
    const callbackUrl = configService.get("INSTAGRAM_CALLBACK_URL");

    if (!clientId || !clientSecret) {
      throw new UnauthorizedException("Instagram OAuth2 not configured");
    }

    super({
      clientID: clientId,
      clientSecret: clientSecret,
      callbackURL: callbackUrl,
    });
  }

  async validate(
    request: any,
    accessToken: string,
    refreshToken: string,
    profile: any,
    done: (err: any, user?: any) => void,
  ): Promise<any> {
    const { id, username } = profile;

    const instagramProfile = {
      id,
      username,
      account_type: profile._json?.account_type,
      media_count: profile._json?.media_count,
    };

    try {
      const user = await this.authService.validateInstagramLogin(
        instagramProfile,
        accessToken,
        refreshToken,
      );
      return done(null, user);
    } catch (err) {
      return done(err, null);
    }
  }
}
